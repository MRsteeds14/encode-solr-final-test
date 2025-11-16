// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SARCToken
 * @notice Solar ARC Token - Proof-of-Generation ERC20 Token
 * @dev Minted on-demand when solar energy is verified, burned on redemption
 * @dev 1 sARC = 1 kWh of verified solar energy generation
 */
contract SARCToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Events
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);
    event TokensBurned(address indexed from, uint256 amount, address indexed burner);

    /**
     * @notice Constructor
     * @dev Grants DEFAULT_ADMIN_ROLE to deployer
     * @dev Deployer must grant MINTER_ROLE to MintingController
     * @dev Deployer must grant BURNER_ROLE to Treasury
     */
    constructor() ERC20("Solar ARC", "sARC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Mint new sARC tokens
     * @param to Address to receive minted tokens
     * @param amount Amount to mint (18 decimals)
     * @dev Only callable by addresses with MINTER_ROLE (MintingController)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be > 0");

        _mint(to, amount);

        emit TokensMinted(to, amount, msg.sender);
    }

    /**
     * @notice Burn tokens from a specific account
     * @param from Address to burn tokens from
     * @param amount Amount to burn (18 decimals)
     * @dev Only callable by addresses with BURNER_ROLE (Treasury)
     * @dev Requires allowance if caller is not the token owner
     */
    function burnFrom(address from, uint256 amount) public override onlyRole(BURNER_ROLE) whenNotPaused {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be > 0");

        // If the burner is not the token owner, check allowance
        if (from != msg.sender) {
            _spendAllowance(from, msg.sender, amount);
        }

        _burn(from, amount);

        emit TokensBurned(from, amount, msg.sender);
    }

    /**
     * @notice Burn tokens (overridden to respect BURNER_ROLE)
     * @param amount Amount to burn
     * @dev Allows token holders to burn their own tokens without BURNER_ROLE
     */
    function burn(uint256 amount) public override whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, msg.sender);
    }

    /**
     * @notice Get token decimals
     * @return uint8 Number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * @notice Pause contract (emergency stop)
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Check if contract supports an interface
     * @param interfaceId Interface ID to check
     * @return bool Whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
