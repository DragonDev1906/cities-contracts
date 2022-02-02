// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/*
    Structure of cityData as bytes32
    1: -SIIIIII // About this city
    2: SOOOSOOO // Information about the neighbors
    3: SOOOSOOO
    4: SOOOSOOO
    5: SOOOSOOO
    6: SOOOSOOO
    7: SOOOSOOO
    8: SOOOSOOO

    -: "0"
    I: tokenId (uint; will be replaced by 0 before storing as these bits will be the level)
    S: size (uint)
    O: offset (int)
*/
struct CityData {
    uint8 size;
    uint24 level;
    uint224 neighborInfo;
}

uint256 constant TOKENID_MASK  = 0x00FFFFFF;
uint256 constant TOKENID_SHIFT = 224;

contract Cities is ERC721 {
    bytes32 dataRootHash; // MerkleProof root used when minting to check if a city exists and if the data is correct
    uint256 dataProofLength;
    mapping(uint256 => CityData) public cityData; // Stores the city data after the token has been minted

    constructor(bytes32 _dataRootHash, uint256 _dataProofLength) ERC721("Cities", "CITY") {
        dataRootHash = _dataRootHash;
        dataProofLength = _dataProofLength;
    }

    function _mintCity(address to, bytes32 _data, bytes32[] calldata proof) internal {
        // Only allow leaf nodes to prevent someone from submitting an intermediate node of the merkle tree
        require(proof.length == dataProofLength, "Invlid proof length");

        // Make sure a city with this data exists
        bool validProof = MerkleProof.verify(proof, dataRootHash, _data);
        require(validProof, "Invalid city data or invalid tokenId");

        // Parse and store city data
        uint256 tokenId = (uint256(_data) >> TOKENID_SHIFT) & TOKENID_MASK;
        cityData[tokenId].size = uint8(uint256(_data) >> 248) & 0x0F;
        cityData[tokenId].level = 0;
        cityData[tokenId].neighborInfo = uint224(uint256(_data));

        // Mint the token
        _safeMint(to, tokenId);
    }

    function mintCity(address to, bytes32 _data, bytes32[] calldata proof) external {
        _mintCity(to, _data, proof);
    }

    function getCityData(uint256 tokenId) external view returns(uint8 _size, uint24 _level, uint224 _neighborInfo) {
        _size = cityData[tokenId].size;
        _level = cityData[tokenId].level;
        _neighborInfo = cityData[tokenId].neighborInfo;
    }
}
