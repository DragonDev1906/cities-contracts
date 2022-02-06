const { expect } = require("chai")
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("Cities contract", () => {
    let accounts;
    let owner, minter, receiver, normalUser;
    const nonMintersVariations = [
        ["the owner", 0],
        ["the receiver", 2],
        ["a normal user", 3]
    ];
    const allVariations = [
        ["the owner", 0],
        ["the minter", 1],
        ["the receiver", 2],
        ["a normal user", 3]
    ];

    const elements = [
        "0x05001337F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2F",
        "0x0F001338F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00",
        "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF01",
        "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF02",
    ];
    let merkleTree;
    let citiesContract;
    let citiesContractFactory;

    getProof = (index) => {
        return merkleTree.getHexProof(keccak256(elements[index]));
    }

    before(async () => {
        // Accounts and variations
        accounts = await ethers.getSigners();
        [owner, minter, receiver, normalUser] = accounts

        // Contract factory
        citiesContractFactory = await ethers.getContractFactory("Cities");
    })

    beforeEach(async () => {
        merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: true, sortPairs: true });
        const root = merkleTree.getHexRoot();

        citiesContract = await citiesContractFactory.deploy(root);
        await citiesContract.grantRole(await citiesContract.MINTER_ROLE(), minter.address)
    })

    describe("Minting", () => {
        it("Allows the minter to mint existing cities", async () => {
            await citiesContract.connect(minter).mintCity(receiver.address, elements[2], getProof(2))
            const receiverBalance = await citiesContract.balanceOf(receiver.address)
            expect(receiverBalance).to.equal(1)
        })

        nonMintersVariations.forEach(([name, accountIndex]) => {
            it(`Does not allow ${name} to mint existing cities`, async () => {
                const signer = accounts[accountIndex]
                await expect(
                    citiesContract.connect(signer).mintCity(receiver.address, elements[2], getProof(2))
                ).to.be.revertedWith("is missing role")
                const receiverBalance = await citiesContract.balanceOf(receiver.address)
                expect(receiverBalance).to.equal(0)
            })
        })
    })
})
