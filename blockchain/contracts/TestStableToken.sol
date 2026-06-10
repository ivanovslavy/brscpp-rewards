// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestStableToken
 * @notice A configurable-decimals ERC-20 used ONLY on GembaBlockchain Testnet to stand in
 *         for USDT / USDC / EURC. Mintable by the owner and any approved minter (the faucet),
 *         so the faucet can hand out test stablecoins without being pre-funded.
 *
 *         These are valueless test tokens — NOT real USDT/USDC/EURC.
 */
contract TestStableToken is ERC20, Ownable {
    uint8 private immutable _customDecimals;
    mapping(address => bool) public isMinter;

    error NotMinter();
    error ZeroAddress();

    event MinterSet(address indexed minter, bool allowed);

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        if (owner_ == address(0)) revert ZeroAddress();
        _customDecimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }

    /// @notice Owner grants/revokes minting rights (e.g. the faucet).
    function setMinter(address minter, bool allowed) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        isMinter[minter] = allowed;
        emit MinterSet(minter, allowed);
    }

    /// @notice Mint test tokens. Owner or an approved minter only.
    function mint(address to, uint256 amount) external {
        if (msg.sender != owner() && !isMinter[msg.sender]) revert NotMinter();
        _mint(to, amount);
    }
}
