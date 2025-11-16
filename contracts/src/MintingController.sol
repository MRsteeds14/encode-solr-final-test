// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface definitions for external contracts
interface IRegistry {
    function isWhitelisted(address _producer) external view returns (bool);
    function validateDailyProduction(address _producer, uint256 _kwhAmount)
        external view returns (bool isValid, string memory reason);
    function recordProduction(address _producer, uint256 _kwhAmount, uint256 _mintedAmount) external;
}

interface ISARCToken {
    function mint(address to, uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

/**
 * @title MintingController
 * @notice Main orchestration contract for sARC token minting
 * @dev Validates production via Registry, mints tokens, implements circuit breaker
 */
contract MintingController is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IRegistry public registry;
    ISARCToken public sarcToken;
    bool public tokenLocked;

    // Minting rate: 1 kWh = 1 sARC (both 18 decimals)
    uint256 public constant KWH_TO_SARC_RATE = 1e18;

    // Circuit breaker parameters
    uint256 public maxDailyMint;           // Maximum sARC that can be minted per day
    uint256 public currentDayMinted;       // Amount minted today
    uint256 public lastMintResetTimestamp; // Last time daily counter was reset
    bool public circuitBreakerTriggered;   // Emergency stop flag

    // Anomaly detection threshold (percentage, e.g., 150 = 150%)
    uint256 public anomalyThreshold;

    // Tracking
    uint256 public totalMinted;
    mapping(address => uint256) public producerTotalMinted;

    // Events
    event Minted(
        address indexed producer,
        uint256 kwhAmount,
        uint256 sarcAmount,
        string ipfsProof
    );
    event CircuitBreakerTriggered(string reason, uint256 timestamp);
    event CircuitBreakerReset(address indexed admin);
    event MaxDailyMintUpdated(uint256 oldMax, uint256 newMax);
    event AnomalyThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event TokenUpdated(address indexed oldToken, address indexed newToken);
    event TokenLocked(address indexed admin);

    /**
     * @notice Constructor
     * @param _registryAddress Registry contract address
     * @param _sarcTokenAddress sARC token address
     * @param _maxDailyMint Maximum daily minting limit
     * @param _anomalyThreshold Anomaly detection threshold (percentage)
     */
    constructor(
        address _registryAddress,
        address _sarcTokenAddress,
        uint256 _maxDailyMint,
        uint256 _anomalyThreshold
    ) {
        require(_registryAddress != address(0), "Invalid registry address");
        require(_sarcTokenAddress != address(0), "Invalid token address");
        require(_maxDailyMint > 0, "Max daily mint must be > 0");

        registry = IRegistry(_registryAddress);
        sarcToken = ISARCToken(_sarcTokenAddress);
        maxDailyMint = _maxDailyMint;
        anomalyThreshold = _anomalyThreshold;
        lastMintResetTimestamp = block.timestamp;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @notice Mint sARC tokens from verified energy generation
     * @param _producer Address of the solar producer
     * @param _kwhAmount Amount of energy in kWh (18 decimals)
     * @param _ipfsProof IPFS hash of generation proof
     * @return mintedAmount Amount of sARC minted
     */
    function mintFromGeneration(
        address _producer,
        uint256 _kwhAmount,
        string memory _ipfsProof
    ) external onlyRole(MINTER_ROLE) nonReentrant whenNotPaused returns (uint256 mintedAmount) {
        require(!circuitBreakerTriggered, "Circuit breaker active");
        require(_producer != address(0), "Invalid producer address");
        require(_kwhAmount > 0, "Amount must be > 0");
        require(bytes(_ipfsProof).length > 0, "IPFS proof required");

        // Reset daily counter if needed (24 hours have passed)
        if (block.timestamp - lastMintResetTimestamp >= 1 days) {
            currentDayMinted = 0;
            lastMintResetTimestamp = block.timestamp;
        }

        // Validate producer is whitelisted
        require(registry.isWhitelisted(_producer), "Producer not whitelisted");

        // Validate production amount via Registry
        (bool isValid, string memory reason) = registry.validateDailyProduction(
            _producer,
            _kwhAmount
        );
        require(isValid, reason);

        // Calculate sARC amount (1:1 ratio, both 18 decimals)
        mintedAmount = (_kwhAmount * KWH_TO_SARC_RATE) / 1e18;

        // Check daily limit
        require(
            currentDayMinted + mintedAmount <= maxDailyMint,
            "Exceeds daily minting limit"
        );

        // Update daily counter
        currentDayMinted += mintedAmount;

        // Update total tracking
        totalMinted += mintedAmount;
        producerTotalMinted[_producer] += mintedAmount;

        // Record production in Registry
        registry.recordProduction(_producer, _kwhAmount, mintedAmount);

        // Mint tokens
        sarcToken.mint(_producer, mintedAmount);

        emit Minted(_producer, _kwhAmount, mintedAmount, _ipfsProof);

        return mintedAmount;
    }

    /**
     * @notice Trigger circuit breaker (emergency stop)
     * @param _reason Reason for triggering
     */
    function triggerCircuitBreaker(
        string memory _reason
    ) external onlyRole(OPERATOR_ROLE) {
        require(!circuitBreakerTriggered, "Already triggered");

        circuitBreakerTriggered = true;

        emit CircuitBreakerTriggered(_reason, block.timestamp);
    }

    /**
     * @notice Reset circuit breaker (admin only)
     */
    function resetCircuitBreaker() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(circuitBreakerTriggered, "Not triggered");

        circuitBreakerTriggered = false;

        emit CircuitBreakerReset(msg.sender);
    }

    /**
     * @notice Update maximum daily minting limit
     * @param _newMax New maximum (18 decimals)
     */
    function setMaxDailyMint(uint256 _newMax) external onlyRole(OPERATOR_ROLE) {
        require(_newMax > 0, "Max must be > 0");

        uint256 oldMax = maxDailyMint;
        maxDailyMint = _newMax;

        emit MaxDailyMintUpdated(oldMax, _newMax);
    }

    /**
     * @notice Update anomaly detection threshold
     * @param _newThreshold New threshold (percentage)
     */
    function setAnomalyThreshold(uint256 _newThreshold) external onlyRole(OPERATOR_ROLE) {
        require(_newThreshold > 0, "Threshold must be > 0");

        uint256 oldThreshold = anomalyThreshold;
        anomalyThreshold = _newThreshold;

        emit AnomalyThresholdUpdated(oldThreshold, _newThreshold);
    }

    /**
     * @notice Update Registry contract address
     * @param _newRegistry New registry address
     */
    function setRegistry(address _newRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newRegistry != address(0), "Invalid address");
        registry = IRegistry(_newRegistry);
    }

    /**
     * @notice Update the sARC token contract address
     * @dev Only callable by DEFAULT_ADMIN_ROLE. Token can be locked permanently.
     */
    function setSarcToken(address _newToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!tokenLocked, "Token is locked");
        require(_newToken != address(0), "Invalid token address");

        address old = address(sarcToken);
        sarcToken = ISARCToken(_newToken);

        emit TokenUpdated(old, _newToken);
    }

    /**
     * @notice Lock the sARC token address forever
     */
    function lockSarcToken() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!tokenLocked, "Already locked");
        tokenLocked = true;
        emit TokenLocked(msg.sender);
    }

    /**
     * @notice Get current minting statistics
     * @return todayMinted Amount minted today
     * @return dailyRemaining Remaining daily capacity
     * @return allTimeMinted Total ever minted
     * @return breakerStatus Circuit breaker status
     */
    function getMintingStats() external view returns (
        uint256 todayMinted,
        uint256 dailyRemaining,
        uint256 allTimeMinted,
        bool breakerStatus
    ) {
        // Check if we should reset counter
        if (block.timestamp - lastMintResetTimestamp >= 1 days) {
            todayMinted = 0;
            dailyRemaining = maxDailyMint;
        } else {
            todayMinted = currentDayMinted;
            dailyRemaining = maxDailyMint > currentDayMinted
                ? maxDailyMint - currentDayMinted
                : 0;
        }

        allTimeMinted = totalMinted;
        breakerStatus = circuitBreakerTriggered;
    }

    /**
     * @notice Get producer-specific minting stats
     * @param _producer Producer address
     * @return totalMintedByProducer Total sARC minted by this producer
     */
    function getProducerStats(address _producer) external view returns (
        uint256 totalMintedByProducer
    ) {
        return producerTotalMinted[_producer];
    }

    /**
     * @notice Pause contract (emergency)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
