// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// =============================================================================
//                            NEXUS PROTOCOL — POC-001
//             Contrat minimal d'enchères inter-IA pour Base Sepolia
// =============================================================================
//
// Identifiants à NE PAS confondre :
//   - chainId Base Sepolia : 84532
//   - chainId Base Mainnet : 8453   ← refus explicite en POC
//
// Référence INPI : DSO2026016080 (déposé 2 mai 2026 — propriétaire avp9 100%).
// Smart contract sous licence MIT pour permettre audit / fork pédagogique.
// L'identité « NEXUS PROTOCOL » et la marque restent propriété d'avp9.
//
// Inspirations auditées :
//   - Zora V3 ReserveAuctionFindersEth
//   - Nouns DAO NounsAuctionHouse
//   - OpenZeppelin Contracts 5.x
//
// Périmètre POC strict :
//   - 1 NFT minté à la fois par le contrat owner (avp9)
//   - 1 enchère active à la fois par tokenId
//   - Whitelist d'agents enchérisseurs (CLAUDE-∑ pour POC-001)
//   - Pas d'extension dans la dernière minute (sniping autorisé, c'est le POC)
//   - Pas de retrait après fin d'enchère sans `settleAuction`
//
// Audit obligatoire AVANT déploiement mainnet — ne JAMAIS déployer en l'état
// sur Base mainnet (8453) ou tout autre réseau de production.
//
// FIN DE VIE DU CONTRAT — décision actée le 11 mai 2026
//   Ce fichier devient mort dès la fin du POC-001. Le contrat de production
//   sera NexusV1.sol, un NOUVEAU contrat (pas une upgrade), réécrit après
//   audit externe payant (Trail of Bits / Spearbit / OpenZeppelin, budget
//   30-80 K€) avec :
//     - anti-sniping (extension automatique +5 min sur bid dans la dernière
//       fenêtre, pattern Nouns DAO)
//     - introduction d'une variable `sellerRecipient` distincte de
//       `platformRecipient` pour le split correct 25/75 (Bloc V2 §6) quand
//       des artistes tiers déposeront leurs œuvres
//     - éventuelle intégration AVPIX si la licence CASP est obtenue
//
// LIMITATION ÉCONOMIQUE DU POC — à connaître avant d'enchaîner
//   En POC, avp9 est à la fois owner-deployer et créateur des œuvres. Le
//   split implémenté ici (royalty + 50% curator + 50% platform du reste)
//   suppose donc implicitement owner == seller. En Phase 2 où l'artiste
//   est tiers, il faudra ajouter un `sellerRecipient` distinct touchant
//   ~75% du prix final, avec un protocole prenant ~25%. Cela exige une
//   réécriture, pas un patch, d'où la décision NexusV1 ci-dessus.
// =============================================================================

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NexusPOC is ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {

    // ------------------------------- Errors ----------------------------------
    error WrongChain(uint256 expected, uint256 got);
    error NotWhitelistedAgent(address agent);
    error AuctionNotActive(uint256 tokenId);
    error AuctionAlreadyExists(uint256 tokenId);
    error AuctionNotEnded(uint256 tokenId);
    error AuctionAlreadySettled(uint256 tokenId);
    error BidTooLow(uint256 required, uint256 got);
    error SelfBid();
    error InvalidDuration(uint256 duration);
    error InvalidReservePrice();
    error InvalidSplit(uint256 sum);
    error TransferFailed();

    // ------------------------------- Events ----------------------------------
    event AgentWhitelisted(address indexed agent, bool allowed);
    event WorkMinted(uint256 indexed tokenId, address indexed creator, string uri, uint96 royaltyBps);
    event AuctionStarted(
        uint256 indexed tokenId,
        uint256 reservePrice,
        uint256 endTime,
        string uri
    );
    event BidPlaced(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount,
        uint256 previousBid
    );
    event AuctionSettled(
        uint256 indexed tokenId,
        address indexed winner,
        uint256 finalPrice,
        uint256 curatorShare,
        uint256 platformShare,
        uint256 royaltyShare
    );
    event AuctionCancelled(uint256 indexed tokenId);

    // ------------------------------- Constants -------------------------------
    /// @dev Base Sepolia testnet ONLY. Toute autre chaîne = revert au constructeur.
    uint256 public constant EXPECTED_CHAIN_ID = 84532;

    /// @dev Incrément minimal d'enchère : +5% du dernier bid.
    uint256 public constant MIN_BID_INCREMENT_BPS = 500; // 5%

    /// @dev Durée min/max d'une enchère (anti-flash / anti-eternal).
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    uint256 public constant MAX_AUCTION_DURATION = 7 days;

    /// @dev Split par défaut : 1/3 curator + 1/3 platform + 1/3 royalty (EIP-2981).
    /// Ces parts sont sur la fraction NON-royalty.
    /// Total enchère = royalty (via royaltyInfo) + reste.
    /// Reste = (1/2 curator) + (1/2 platform). On nomme les variables en clair pour
    /// éviter les confusions. Voir _settle() pour la mécanique exacte.
    uint256 public constant CURATOR_BPS_OF_REMAINDER = 5000; // 50% du reste
    uint256 public constant PLATFORM_BPS_OF_REMAINDER = 5000; // 50% du reste

    // ------------------------------- Storage ---------------------------------
    struct Auction {
        uint256 reservePrice;
        uint256 highestBid;
        address highestBidder;
        uint64  endTime;
        bool    settled;
        bool    exists;
    }

    /// @notice Adresse du curateur (CLAUDE-∑ wallet operationnel pour le POC).
    address public curatorRecipient;

    /// @notice Adresse de la plateforme (avp9 wallet).
    address public platformRecipient;

    /// @notice Wallets autorisés à enchérir. En POC : 1 seul agent (CLAUDE-∑).
    mapping(address => bool) public whitelistedAgents;

    /// @notice Enchère par tokenId.
    mapping(uint256 => Auction) public auctions;

    /// @notice Compteur de tokens mintés.
    uint256 public totalSupply;

    // ----------------------------- Constructor -------------------------------
    constructor(
        address _curatorRecipient,
        address _platformRecipient
    ) ERC721("NEXUS Protocol POC", "NEXUS-POC") Ownable(msg.sender) {
        // Garde-fou chaîne — refus de déploiement hors Base Sepolia.
        if (block.chainid != EXPECTED_CHAIN_ID) {
            revert WrongChain(EXPECTED_CHAIN_ID, block.chainid);
        }
        require(_curatorRecipient != address(0), "curator=0");
        require(_platformRecipient != address(0), "platform=0");
        curatorRecipient = _curatorRecipient;
        platformRecipient = _platformRecipient;
    }

    // --------------------------- Owner: whitelist ----------------------------
    function setAgentWhitelist(address agent, bool allowed) external onlyOwner {
        whitelistedAgents[agent] = allowed;
        emit AgentWhitelisted(agent, allowed);
    }

    function setCuratorRecipient(address newCurator) external onlyOwner {
        require(newCurator != address(0), "curator=0");
        curatorRecipient = newCurator;
    }

    function setPlatformRecipient(address newPlatform) external onlyOwner {
        require(newPlatform != address(0), "platform=0");
        platformRecipient = newPlatform;
    }

    // ----------------------------- Owner: mint -------------------------------
    /// @notice Mint une œuvre. `creator` reçoit la royalty EIP-2981 sur ventes secondaires.
    /// @dev royaltyBps = 833 pour 8.333% (cf. décision NEXUS PROTOCOL V2 §7).
    function mintWork(
        address creator,
        string calldata uri,
        uint96 royaltyBps
    ) external onlyOwner returns (uint256 tokenId) {
        require(creator != address(0), "creator=0");
        require(royaltyBps <= 1000, "royalty>10%"); // garde-fou raisonnable
        tokenId = ++totalSupply;
        _safeMint(owner(), tokenId);
        _setTokenURI(tokenId, uri);
        // EIP-2981 : la royalty va au CRÉATEUR, pas au plateforme.
        _setTokenRoyalty(tokenId, creator, royaltyBps);
        emit WorkMinted(tokenId, creator, uri, royaltyBps);
    }

    // ------------------------- Owner: open auction ---------------------------
    function startAuction(
        uint256 tokenId,
        uint256 reservePrice,
        uint256 duration
    ) external onlyOwner {
        if (auctions[tokenId].exists) revert AuctionAlreadyExists(tokenId);
        if (reservePrice == 0) revert InvalidReservePrice();
        if (duration < MIN_AUCTION_DURATION || duration > MAX_AUCTION_DURATION) {
            revert InvalidDuration(duration);
        }
        require(_ownerOf(tokenId) == owner(), "not owned by contract owner");

        uint64 end = uint64(block.timestamp + duration);
        auctions[tokenId] = Auction({
            reservePrice: reservePrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: end,
            settled: false,
            exists: true
        });

        emit AuctionStarted(tokenId, reservePrice, end, tokenURI(tokenId));
    }

    // --------------------------- Agent: place bid ----------------------------
    function placeBid(uint256 tokenId) external payable nonReentrant {
        if (!whitelistedAgents[msg.sender]) revert NotWhitelistedAgent(msg.sender);
        Auction storage a = auctions[tokenId];
        if (!a.exists || a.settled) revert AuctionNotActive(tokenId);
        if (block.timestamp >= a.endTime) revert AuctionNotActive(tokenId);
        if (msg.sender == a.highestBidder) revert SelfBid();

        uint256 minRequired;
        if (a.highestBid == 0) {
            minRequired = a.reservePrice;
        } else {
            // +5% sur le bid précédent
            minRequired = a.highestBid + (a.highestBid * MIN_BID_INCREMENT_BPS) / 10000;
        }
        if (msg.value < minRequired) revert BidTooLow(minRequired, msg.value);

        address previousBidder = a.highestBidder;
        uint256 previousBid = a.highestBid;

        // Effects
        a.highestBidder = msg.sender;
        a.highestBid = msg.value;

        // Interactions — refund de l'ancien enchérisseur s'il y en avait un.
        if (previousBidder != address(0) && previousBid > 0) {
            (bool ok, ) = previousBidder.call{value: previousBid}("");
            if (!ok) revert TransferFailed();
        }

        emit BidPlaced(tokenId, msg.sender, msg.value, previousBid);
    }

    // ------------------------ Anyone: settle auction -------------------------
    function settleAuction(uint256 tokenId) external nonReentrant {
        Auction storage a = auctions[tokenId];
        if (!a.exists) revert AuctionNotActive(tokenId);
        if (a.settled) revert AuctionAlreadySettled(tokenId);
        if (block.timestamp < a.endTime) revert AuctionNotEnded(tokenId);

        a.settled = true;

        if (a.highestBidder == address(0)) {
            // Personne n'a enchéri, fin sans transfert.
            emit AuctionCancelled(tokenId);
            return;
        }

        uint256 finalPrice = a.highestBid;

        // Calcul royalty via EIP-2981 (renvoie le créateur d'origine).
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(tokenId, finalPrice);

        uint256 remainder = finalPrice - royaltyAmount;
        uint256 curatorShare = (remainder * CURATOR_BPS_OF_REMAINDER) / 10000;
        uint256 platformShare = remainder - curatorShare; // évite la perte par arrondi

        // Transferts (effects-then-interactions déjà OK : settled = true posé avant).
        _safeSendEth(royaltyReceiver, royaltyAmount);
        _safeSendEth(curatorRecipient, curatorShare);
        _safeSendEth(platformRecipient, platformShare);

        // NFT vers le gagnant.
        _safeTransfer(owner(), a.highestBidder, tokenId, "");

        emit AuctionSettled(
            tokenId,
            a.highestBidder,
            finalPrice,
            curatorShare,
            platformShare,
            royaltyAmount
        );
    }

    // ----------------------------- View helpers ------------------------------
    function getAuction(uint256 tokenId) external view returns (Auction memory) {
        return auctions[tokenId];
    }

    function isAgent(address a) external view returns (bool) {
        return whitelistedAgents[a];
    }

    // ----------------------------- Internals ---------------------------------
    function _safeSendEth(address to, uint256 amount) private {
        if (amount == 0) return;
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    // ------------------------------- ERC165 ----------------------------------
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, ERC2981) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
