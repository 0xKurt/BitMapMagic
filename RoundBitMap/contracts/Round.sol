// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

contract Round {
    bytes32[] public projectStates;
    bytes32[] public projectIds;

    mapping(bytes32 => uint256) public projectNum;

    uint256 public constant STATUS_PENDING = 1;
    uint256 public constant STATUS_ACCEPTED = 2;
    uint256 public constant STATUS_REJECTED = 3;

    function applyToRound(bytes32 projectId) external {
        uint256 num = projectNum[projectId];

        if (num == 0) {
            projectIds.push(projectId);
            num = projectIds.length;
            projectNum[projectId] = num;
        }

        uint256 index = num - 1;

        // If the current `projectStates` array can't hold another 32 project statuses,
        // then create a new `bytes32` to hold the additional statuses.
        if (index % 32 == 0) {
            projectStates.push(0);
        }
        // Calculate the index within the `projectStates` array where the project status will be stored.
        uint256 stateIndex = index / 32;

        // Calculate the position within the `bytes32` where the project status will be stored.
        uint256 position = (index % 32) * 2;

        // Update the project status in the `projectStates` array.
        bytes32 currentState = projectStates[stateIndex];
        currentState &= ~(bytes32(uint(3)) << position);
        currentState |= bytes32(STATUS_PENDING) << position;

        projectStates[stateIndex] = currentState;
    }

    function getStatus(bytes32 projectId) external view returns (uint256) {
        uint256 num = projectNum[projectId];
        if (num == 0) return 0;

        uint256 index = num - 1;

        uint256 stateIndex = index / 32;
        uint256 position = (index % 32) * 2;

        bytes32 currentState = projectStates[stateIndex];
        uint256 status = uint256((currentState >> position) & bytes32(uint(3)));

        return status;
    }

    // just for testing
    function getProjectStateLength() external view returns (uint256) {
        return projectStates.length;
    }

    function setStates(uint256[] memory index_, bytes32[] memory newStates_) external {
        require(index_.length == newStates_.length, "Invalid input length");

        for (uint256 i = 0; i < index_.length; i++) {
            uint256 index = index_[i];
            bytes32 newState = newStates_[i];

            projectStates[index] = newState;
        }
    }

    // ignore this one
    function changeStatus(
        bytes32[] calldata projectIds_,
        uint256[] calldata statuses_
    ) external {
        require(projectIds_.length == statuses_.length, "Invalid input length");

        for (uint256 i = 0; i < projectIds_.length; i++) {
            bytes32 projectId = projectIds_[i];
            uint256 status = statuses_[i];
            uint256 num = projectNum[projectId];

            require(num != 0, "Project not found");

            uint256 index = num - 1;

            uint256 stateIndex = index / 32;
            uint256 position = (index % 32) * 2;

            bytes32 currentState = projectStates[stateIndex];
            currentState &= ~(bytes32(uint(3)) << position);
            currentState |= bytes32(status) << position;
            projectStates[stateIndex] = currentState;
        }
    }
}
