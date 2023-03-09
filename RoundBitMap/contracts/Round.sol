// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

contract Round {
    uint256[] public projectStates;
    bytes32[] public projectIds;

    mapping(bytes32 => uint256) public projectNum;

    // NO_STATUS = 0
    uint256 public constant STATUS_PENDING = 1;
    uint256 public constant STATUS_ACCEPTED = 2;
    uint256 public constant STATUS_REJECTED = 3;

    function applyToRound(bytes32 _projectId) external {
        uint256 num = projectNum[_projectId];

        if (num == 0) {
            projectIds.push(_projectId);
            num = projectIds.length;
            projectNum[_projectId] = num;
        }

        uint256 index = num - 1;

        if (index % 128 == 0) {
            projectStates.push(0);
        }
        // Calculate the index within the `projectStates` array where the project status will be stored.
        uint256 stateIndex = index / 128;

        uint256 position = (index % 128) * 2;

        // Update the project status in the `projectStates` array.
        uint256 currentState = projectStates[stateIndex];
        currentState &= ~(3 << position);
        currentState |= STATUS_PENDING << position;

        projectStates[stateIndex] = currentState;
    }

    function getStatus(bytes32 _projectId) external view returns (uint256) {
        uint256 num = projectNum[_projectId];
        if (num == 0) return 0;

        uint256 index = num - 1;

        uint256 stateIndex = index / 128;
        uint256 position = (index % 128) * 2;

        uint256 currentState = projectStates[stateIndex];
        uint256 status = uint256((currentState >> position) & 3);

        return status;
    }

    function _setProjectState(uint256 _index, uint256 _newState) internal {
        require(_index < projectStates.length, "Invalid index");
        projectStates[_index] = _newState;
    }

    function setProjectState(uint256 _index, uint256 _newState) external {
        _setProjectState(_index, _newState);
    }

    function setProjectStates(
        uint256[] memory _index,
        uint256[] memory _newStates
    ) external {
        require(_index.length == _newStates.length, "Invalid input length");

        for (uint256 i = 0; i < _index.length; i++) {
            uint256 index = _index[i];
            uint256 newState = _newStates[i];
            _setProjectState(index, newState);
        }
    }

    // just for testing
    function getProjectStateLength() external view returns (uint256) {
        return projectStates.length;
    }
}
