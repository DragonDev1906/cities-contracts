const { expect } = require("chai")
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("Cities contract", () => {
    it("Allows minting", async () => {
        const [owner] = await ethers.getSigners();
        const CitiesContractFactory = await ethers.getContractFactory("Cities");

        const elements = [
            "0x05001337F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2F",
            "0x0F001338F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
            "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00",
        ]
        const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: false, sortPairs: true });
        const root = merkleTree.getHexRoot();
        const proof = merkleTree.getHexProof(elements[0]);
        merkleTree.print()

        console.log("proof:", proof)

        const CitiesContract = await CitiesContractFactory.deploy(root, 2);
        // await CitiesContract.mintCity(owner.address, "0x3faa5d346268279febf1b1db7d67b837e72fa0a0e88d8ccca3a0fb32e759f2e1", [])
        await CitiesContract.mintCity(owner.address, elements[0], proof);

        // const data = await CitiesContract.getCityData(0x1337);
        const data = await CitiesContract.getCityData(0xaa5d34);
        console.log(data);
    })
})
