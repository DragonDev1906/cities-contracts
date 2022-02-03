const { expect } = require("chai")
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("Cities contract", () => {
    it("Allows minting (manual test)", async () => {
        const [owner] = await ethers.getSigners();
        const CitiesContractFactory = await ethers.getContractFactory("Cities");

        const index = 3;
        const elements = [
            "0x05001337F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2F",
            "0x0F001338F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
            "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00",
            "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF01",
            "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF02",
            "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF03",
            "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF04",
            "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF05",
            "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF06",
            "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF07",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        ]
        const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: true, sortPairs: true });
        const root = merkleTree.getHexRoot();
        const proof = merkleTree.getHexProof(keccak256(elements[index]));
        merkleTree.print()

        console.log("proof:", proof)

        const CitiesContract = await CitiesContractFactory.deploy(root);
        // await CitiesContract.mintCity(owner.address, "0x3faa5d346268279febf1b1db7d67b837e72fa0a0e88d8ccca3a0fb32e759f2e1", [])
        await CitiesContract.mintCity(elements[index], proof);

        // const data = await CitiesContract.getCityData(0x1337);
        const data = await CitiesContract.getCityData(0xaa5d34);
        console.log(data);
    })
})

// proofLength without require  : 98327
// proofLength                  : 98319
// hashLeaves=true              : 96298
// proofLength with constant    : 96219
// no checks                    : 96196