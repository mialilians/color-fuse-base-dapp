// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ColorFuse {
    uint256 public nextFuseId = 1;

    struct Fuse {
        address maker;
        string label;
        string colorA;
        string colorB;
        string mood;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => Fuse) private fuses;

    event FuseSaved(
        uint256 indexed fuseId,
        address indexed maker,
        string label,
        string colorA,
        string colorB
    );

    function saveFuse(
        string calldata label,
        string calldata colorA,
        string calldata colorB,
        string calldata mood,
        string calldata note
    ) external returns (uint256 fuseId) {
        require(bytes(label).length > 0 && bytes(label).length <= 36, "Invalid label");
        require(bytes(colorA).length == 7 && bytes(colorB).length == 7, "Invalid colors");
        require(bytes(mood).length > 0 && bytes(mood).length <= 18, "Invalid mood");
        require(bytes(note).length > 0 && bytes(note).length <= 120, "Invalid note");

        fuseId = nextFuseId++;
        fuses[fuseId] = Fuse({
            maker: msg.sender,
            label: label,
            colorA: colorA,
            colorB: colorB,
            mood: mood,
            note: note,
            createdAt: block.timestamp
        });

        emit FuseSaved(fuseId, msg.sender, label, colorA, colorB);
    }

    function getFuse(
        uint256 fuseId
    )
        external
        view
        returns (
            address maker,
            string memory label,
            string memory colorA,
            string memory colorB,
            string memory mood,
            string memory note,
            uint256 createdAt
        )
    {
        Fuse storage entry = fuses[fuseId];
        return (
            entry.maker,
            entry.label,
            entry.colorA,
            entry.colorB,
            entry.mood,
            entry.note,
            entry.createdAt
        );
    }
}
