const { expect } = require("chai")
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("Cities contract", () => {
    let accounts;
    let owner, minter, receiver, normalUser;
    const nonMintersVariations = [
        ["the owner    ", 0],
        ["the receiver ", 2],
        ["a normal user", 3]
    ];
    const allVariations = [
        ["the owner    ", 0],
        ["the minter   ", 1],
        ["the receiver ", 2],
        ["a normal user", 3]
    ];

    const elements = [
        "0x05001337F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2F",
        "0x0F001338F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00",
        "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF01",
        "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF02",
    ];
    const exampleInvalidElement = "0x0F001339F4FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFAFF02"; // Only invalid because it isn't in elements
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

        allVariations.forEach(([name, accountIndex]) => {
            // This should be done ith formal verification
            it(`Does not allow ${name} to mint wrong cities`, async () => {
                const signer = accounts[accountIndex]
                await expect(
                    citiesContract.connect(signer).mintCity(receiver.address, exampleInvalidElement, getProof(2)) // Using the proof for 2 as an example. Testing this thorrowly would require formal verification
                ).to.be.revertedWith(signer == minter ? "Invalid data" : "is missing role")
            })
        })

        it("Does not allow the minter to use intermediate nodes", async () => {
            // This should be done with formal verification
            const intermediateNode = getProof(4)[0]
            const child1 = getProof(2)[1]
            const child2 = getProof(0)[1]
            const sibling = getProof(0)[2]

            // Just some examples that may go wrong, these are by far not all possibilities
            await expect(
                citiesContract.connect(minter).mintCity(receiver.address, intermediateNode, [sibling])
            ).to.be.revertedWith("Invalid data")
            await expect(
                citiesContract.connect(minter).mintCity(receiver.address, child1, [child2, sibling])
            ).to.be.revertedWith("Invalid data")
            await expect(
                citiesContract.connect(minter).mintCity(receiver.address, child2, [child1, sibling])
            ).to.be.revertedWith("Invalid data")
        })
    })
})
