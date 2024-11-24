// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SpaceGame {
    struct Spaceship {
        uint256 id;
        string name;
        uint256 level;
        uint256 experience;
        uint256 lastMiningTime;
    }
    
    mapping(address => Spaceship) public spaceships;
    
    event ShipCreated(address owner, uint256 shipId, string name);
    event ResourceMined(address owner, uint256 amount);
    
    function createShip(string memory _name) public {
        require(spaceships[msg.sender].id == 0, "Ship already exists");
        uint256 shipId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        spaceships[msg.sender] = Spaceship(shipId, _name, 1, 0, block.timestamp);
        emit ShipCreated(msg.sender, shipId, _name);
    }
    
    function mineResources() public {
        require(spaceships[msg.sender].id != 0, "No ship found");
        require(block.timestamp >= spaceships[msg.sender].lastMiningTime + 1 hours, "Mining cooldown");
        
        uint256 miningReward = 10 * spaceships[msg.sender].level;
        spaceships[msg.sender].experience += miningReward;
        spaceships[msg.sender].lastMiningTime = block.timestamp;
        
        emit ResourceMined(msg.sender, miningReward);
    }
} 