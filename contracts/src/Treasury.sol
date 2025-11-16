// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interface for sARC token burn functionality
interface ISARCToken {
    function burnFrom(address from, uint256 amount) external;
}

/**
 * @title Treasury
 * @notice Manages sARC → USDC redemptions with exchange rate management
 * @dev Handles decimal conversion (18-decimal sARC to 18-decimal USDC on Arc)
 * @dev Burns sARC tokens on redemption (deflationary model)
 */
contract Treasury is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    IERC20 public immutable sarcToken;
    IERC20 public immutable usdcToken;

    // Exchange rate: USDC per kWh (18 decimals for Arc's native USDC)
    // Default: 0.10 USDC per kWh = 100000000000000 (0.10 * 10^18)
    uint256 public usdcPerKwh;

    // Total redemptions tracking
    uint256 public totalRedeemed;
    uint256 public totalUsdcDistributed;

    // Minimum redemption amount (1 sARC = 1 kWh)
    uint256 public constant MIN_REDEMPTION = 1 ether;

    // Events
    event Redeemed(
        address indexed user,
        uint256 sarcAmount,
        uint256 usdcAmount,
        string ipfsProof
    );
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event TreasuryFunded(address indexed funder, uint256 amount);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    /**
     * @notice Constructor
     * @param _sarcToken sARC token address (18 decimals)
     * @param _usdcToken USDC token address (18 decimals on Arc Testnet - native gas token)
     * @param _usdcPerKwh Initial exchange rate (18 decimals, e.g., 100000000000000 for 0.10 USDC)
     */
    constructor(
        address _sarcToken,
        address _usdcToken,
        uint256 _usdcPerKwh
    ) {
        require(_sarcToken != address(0), "Invalid sARC address");
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_usdcPerKwh > 0, "Exchange rate must be > 0");

        sarcToken = IERC20(_sarcToken);
        usdcToken = IERC20(_usdcToken);
        usdcPerKwh = _usdcPerKwh;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    /**
     * @notice Redeem sARC tokens for USDC
     * @param _sarcAmount Amount of sARC to redeem (18 decimals)
     * @param _ipfsProof IPFS hash of redemption proof/receipt
     */
    function redeemForUSDC(
        uint256 _sarcAmount,
        string memory _ipfsProof
    ) external nonReentrant whenNotPaused {
        require(_sarcAmount >= MIN_REDEMPTION, "Amount below minimum");
        require(bytes(_ipfsProof).length > 0, "IPFS proof required");

        // Check user has enough sARC
        require(
            sarcToken.balanceOf(msg.sender) >= _sarcAmount,
            "Insufficient sARC balance"
        );

        // Calculate USDC amount
        // sARC has 18 decimals (1 sARC = 1 kWh)
        // USDC has 18 decimals on Arc (native gas token)
        // Formula: (sarcAmount / 10^18) * (usdcPerKwh / 10^18) * 10^18
        // Simplifies to: (sarcAmount * usdcPerKwh) / 10^6
        uint256 usdcAmount = (_sarcAmount * usdcPerKwh) / 1e6;

        require(usdcAmount > 0, "USDC amount too small");

        // Check Treasury has enough USDC
        uint256 treasuryBalance = usdcToken.balanceOf(address(this));
        require(treasuryBalance >= usdcAmount, "Insufficient Treasury balance");

        // Transfer sARC to Treasury first (required before burning)
        sarcToken.safeTransferFrom(msg.sender, address(this), _sarcAmount);

        // Burn sARC tokens (permanently destroy, reduces totalSupply)
        ISARCToken(address(sarcToken)).burnFrom(address(this), _sarcAmount);

        // Transfer USDC to user
        usdcToken.safeTransfer(msg.sender, usdcAmount);

        // Update tracking
        totalRedeemed += _sarcAmount;
        totalUsdcDistributed += usdcAmount;

        emit Redeemed(msg.sender, _sarcAmount, usdcAmount, _ipfsProof);
    }

    /**
     * @notice Calculate USDC amount for given sARC
     * @param _sarcAmount sARC amount (18 decimals)
     * @return usdcAmount Corresponding USDC amount (6 decimals)
     */
    function calculateRedemptionAmount(
        uint256 _sarcAmount
    ) external view returns (uint256 usdcAmount) {
        return (_sarcAmount * usdcPerKwh) / 1e18;
    }

    /**
     * @notice Update exchange rate
     * @param _newRate New USDC per kWh (6 decimals)
     */
    function setExchangeRate(uint256 _newRate) external onlyRole(OPERATOR_ROLE) {
        require(_newRate > 0, "Rate must be > 0");

        uint256 oldRate = usdcPerKwh;
        usdcPerKwh = _newRate;

        emit ExchangeRateUpdated(oldRate, _newRate);
    }

    /**
     * @notice Fund Treasury with USDC
     * @param _amount Amount of USDC to add (6 decimals)
     */
    function fundTreasury(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");

        usdcToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit TreasuryFunded(msg.sender, _amount);
    }

    /**
     * @notice Get Treasury balance
     * @return sarcBalance Amount of sARC held
     * @return usdcBalance Amount of USDC held
     */
    function getTreasuryBalance() external view returns (
        uint256 sarcBalance,
        uint256 usdcBalance
    ) {
        sarcBalance = sarcToken.balanceOf(address(this));
        usdcBalance = usdcToken.balanceOf(address(this));
    }

    /**
     * @notice Emergency withdraw USDC (admin only)
     * @param _to Address to send USDC
     * @param _amount Amount to withdraw
     */
    function emergencyWithdrawUSDC(
        address _to,
        uint256 _amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_to != address(0), "Invalid address");

        usdcToken.safeTransfer(_to, _amount);

        emit EmergencyWithdraw(_to, _amount);
    }

    /**
     * @notice Emergency withdraw sARC (admin only)
     * @param _to Address to send sARC
     * @param _amount Amount to withdraw
     */
    function emergencyWithdrawSARC(
        address _to,
        uint256 _amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_to != address(0), "Invalid address");

        sarcToken.safeTransfer(_to, _amount);

        emit EmergencyWithdraw(_to, _amount);
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
