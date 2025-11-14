// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RegistryV2
 * @notice Manages solar producer registrations and production validation
 * @dev Whitelists producers, tracks capacity, validates daily limits
 * @dev V2: Pre-configures roles for MintingController and AI Agent in constructor
 */
contract RegistryV2 is AccessControl, Pausable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct Producer {
        bool isWhitelisted;
        uint256 systemCapacityKw;      // Total system capacity in kilowatts
        uint256 dailyCapKwh;            // Daily generation cap in kilowatt-hours
        uint256 totalMinted;            // Total sARC minted all-time
        uint256 lastMintTimestamp;      // Last time minting occurred
        string ipfsMetadata;            // IPFS hash with system details
        uint256 registrationDate;       // When producer was registered
    }

    // Mapping from producer address to their details
    mapping(address => Producer) public producers;

    // Events
    event ProducerRegistered(
        address indexed producer,
        uint256 systemCapacityKw,
        uint256 dailyCapKwh,
        string ipfsMetadata
    );
    event ProducerUpdated(address indexed producer, uint256 newCapacityKw, uint256 newDailyCap);
    event ProducerRemoved(address indexed producer);
    event ProductionRecorded(address indexed producer, uint256 kwhAmount, uint256 mintedAmount);

    /**
     * @notice Constructor with pre-configured roles
     * @param _mintingController Address of the MintingController contract
     * @param _aiAgent Address of the AI Agent wallet
     * @dev Grants OPERATOR_ROLE to both MintingController and AI Agent
     * @dev Deployer gets DEFAULT_ADMIN_ROLE and OPERATOR_ROLE
     */
    constructor(address _mintingController, address _aiAgent) {
        require(_mintingController != address(0), "Invalid MintingController address");
        require(_aiAgent != address(0), "Invalid AI Agent address");

        // Grant admin role to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        // Grant OPERATOR_ROLE to MintingController (for recordProduction)
        _grantRole(OPERATOR_ROLE, _mintingController);

        // Grant OPERATOR_ROLE to AI Agent (for registerProducer)
        _grantRole(OPERATOR_ROLE, _aiAgent);
    }

    /**
     * @notice Register a new solar producer
     * @param _producer Address of the solar producer
     * @param _systemCapacityKw System capacity in kilowatts
     * @param _dailyCapKwh Daily generation cap in kilowatt-hours
     * @param _ipfsMetadata IPFS hash with system documentation
     */
    function registerProducer(
        address _producer,
        uint256 _systemCapacityKw,
        uint256 _dailyCapKwh,
        string memory _ipfsMetadata
    ) external onlyRole(OPERATOR_ROLE) {
        require(_producer != address(0), "Invalid producer address");
        require(!producers[_producer].isWhitelisted, "Producer already registered");
        require(_systemCapacityKw > 0, "System capacity must be > 0");
        require(_dailyCapKwh > 0, "Daily cap must be > 0");
        require(_dailyCapKwh <= _systemCapacityKw * 8, "Daily cap exceeds realistic production");

        producers[_producer] = Producer({
            isWhitelisted: true,
            systemCapacityKw: _systemCapacityKw,
            dailyCapKwh: _dailyCapKwh,
            totalMinted: 0,
            lastMintTimestamp: 0,
            ipfsMetadata: _ipfsMetadata,
            registrationDate: block.timestamp
        });

        emit ProducerRegistered(_producer, _systemCapacityKw, _dailyCapKwh, _ipfsMetadata);
    }

    /**
     * @notice Update an existing producer's capacity
     * @param _producer Address of the solar producer
     * @param _newCapacityKw New system capacity
     * @param _newDailyCap New daily generation cap
     */
    function updateProducer(
        address _producer,
        uint256 _newCapacityKw,
        uint256 _newDailyCap
    ) external onlyRole(OPERATOR_ROLE) {
        require(producers[_producer].isWhitelisted, "Producer not registered");
        require(_newCapacityKw > 0, "System capacity must be > 0");
        require(_newDailyCap > 0, "Daily cap must be > 0");

        producers[_producer].systemCapacityKw = _newCapacityKw;
        producers[_producer].dailyCapKwh = _newDailyCap;

        emit ProducerUpdated(_producer, _newCapacityKw, _newDailyCap);
    }

    /**
     * @notice Remove a producer from the whitelist
     * @param _producer Address to remove
     */
    function removeProducer(address _producer) external onlyRole(OPERATOR_ROLE) {
        require(producers[_producer].isWhitelisted, "Producer not registered");

        producers[_producer].isWhitelisted = false;

        emit ProducerRemoved(_producer);
    }

    /**
     * @notice Check if a producer is whitelisted
     * @param _producer Address to check
     * @return bool Whether producer is whitelisted
     */
    function isWhitelisted(address _producer) external view returns (bool) {
        return producers[_producer].isWhitelisted;
    }

    /**
     * @notice Validate if a production claim is within daily limits
     * @param _producer Address of the producer
     * @param _kwhAmount Amount of kWh claimed
     * @return isValid Whether the claim is valid
     * @return reason Reason for validation result
     */
    function validateDailyProduction(
        address _producer,
        uint256 _kwhAmount
    ) external view returns (bool isValid, string memory reason) {
        Producer memory producer = producers[_producer];

        if (!producer.isWhitelisted) {
            return (false, "Producer not whitelisted");
        }

        if (_kwhAmount == 0) {
            return (false, "Amount must be > 0");
        }

        if (_kwhAmount > producer.dailyCapKwh) {
            return (false, "Exceeds daily cap");
        }

        // Check if enough time has passed since last mint (1 hour minimum)
        if (producer.lastMintTimestamp > 0 &&
            block.timestamp - producer.lastMintTimestamp < 1 hours) {
            return (false, "Minting too frequently");
        }

        // Basic sanity check: can't produce more than 12 hours of peak capacity per day
        if (_kwhAmount > producer.systemCapacityKw * 12) {
            return (false, "Exceeds physical capacity");
        }

        return (true, "Valid");
    }

    /**
     * @notice Record production minting (called by MintingController)
     * @param _producer Address of the producer
     * @param _kwhAmount Amount of kWh produced
     * @param _mintedAmount Amount of sARC minted
     */
    function recordProduction(
        address _producer,
        uint256 _kwhAmount,
        uint256 _mintedAmount
    ) external onlyRole(OPERATOR_ROLE) {
        require(producers[_producer].isWhitelisted, "Producer not whitelisted");

        producers[_producer].totalMinted += _mintedAmount;
        producers[_producer].lastMintTimestamp = block.timestamp;

        emit ProductionRecorded(_producer, _kwhAmount, _mintedAmount);
    }

    /**
     * @notice Get full producer details
     * @param _producer Address to query
     * @return Producer struct with all details
     */
    function getProducer(address _producer) external view returns (Producer memory) {
        return producers[_producer];
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
