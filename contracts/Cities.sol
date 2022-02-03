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
    /// @dev Store the MerkleTree root used for checking city existance and data integrity when minting. TODO: changing this to a constant should reduce the gas cost of _mintCity by about 2100 (gas cost of SLOAD since EIP-2929, Berlin)
    bytes32 dataRootHash;

    /// @dev Store city data after the token has been minted
    mapping(uint256 => CityData) public cityData;

    /// @notice Constructor
    /// @dev Stores _dataRootHash for use in _mintCity
    /// @param _dataRootHash root of the MerkleTree used in _mintCity for chekcing existance and integrity of city data
    constructor(bytes32 _dataRootHash) ERC721("Cities", "CITY") {
        dataRootHash = _dataRootHash;
    }

    /// @notice Mint a city ERC721 token using the tokenID stored in _data
    /// @dev We don't need more than 2**24 different cities and the ID must be checked against the dataRootHash. To save gas we take it as one bytes32 parameter instead of using abi.encodePacked() before verifying the MerkleProof. There needs to be a mechanism for making sure intermediate nodes of the MerkleTree are not valid, otherwise someone could add a valid tokenID with garbage neighborhood information. This is done by hashing leaves of the MerkleTree (note: this would NOT be sufficient if _data would consist of 33-64 bytes). Alternatively proof.length could be checked, but this would require longer proofs for later entries. Paying about 80 additional gas for each city sounds better than paying about 1250 additional gas per increase in the proof size, even though the second only affects the later entries (note: if there are 2**x+1 cities the second option is probably cheaper, but in most cases the first one should be).
    /// @param to receiver of the minted token
    /// @param data 32 bytes containing city size and neighbor information that is checked using a MerkleProof to see if a city with this information exists.
    /// @param proof MerkleTree proof for _data
    function _mintCity(address to, bytes32 data, bytes32[] calldata proof) internal {
        // Make sure a city with this data exists (note: this is only secure for len(_data)<=32  and len(_data)>64)
        bool validProof = MerkleProof.verify(proof, dataRootHash, _keccak256(data));
        require(validProof, "Invalid _data");

        // Parse and store city data
        uint256 tokenId = (uint256(data) >> TOKENID_SHIFT) & TOKENID_MASK;
        cityData[tokenId].size = uint8(uint256(data) >> 248) & 0x0F;
        cityData[tokenId].level = 0;
        cityData[tokenId].neighborInfo = uint224(uint256(data));

        // Mint the token
        _safeMint(to, tokenId);
    }

    /// @notice Efficiently compute the hash of a single bytes32 value
    /// @dev Without this we'd probably have to use abi.encodePacked, which costs a significant amount of gas (unless the optimizer recognizes what we want)
    /// @param value The bytes32 value to be hashed
    /// @return hashed The hashed value
    function _keccak256(bytes32 value) private pure returns (bytes32 hashed) {
        assembly {
            mstore(0x00, value)
            hashed := keccak256(0x00, 0x20)
        }
    }

    /// @notice Mint a (specific) city with the tokenId in data
    /// @dev For now this is sufficient. TODO This function will need a limitation such that it can only be called by a CitySale contract that requires payment (Split due to Separation of Concerns)
    /// @param data The data of the city to be minted (includes the tokenId)
    /// @param proof Proof that a city with this data exists
    function mintCity(bytes32 data, bytes32[] calldata proof) external {
        _mintCity(msg.sender, data, proof);
    }

    function getCityData(uint256 tokenId) external view returns(uint8 _size, uint24 _level, uint224 _neighborInfo) {
        _size = cityData[tokenId].size;
        _level = cityData[tokenId].level;
        _neighborInfo = cityData[tokenId].neighborInfo;
    }
}
