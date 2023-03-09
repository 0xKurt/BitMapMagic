const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const STATUS = {
  NOT_APPLIED: 0,
  PENDING: 1,
  ACCEPTED: 2,
  REJECTED: 3,
};

const getProjectId = (s) => {
  const hexString = Buffer.from("Project" + s, "utf8").toString("hex");
  return ethers.utils.keccak256("0x" + hexString);
};

const buildNewState = (currentState, projectIdArray, numArray, statusArray) => {
  let newState = BigInt(currentState);

  for (let i = 0; i < projectIdArray.length; i++) {
    const index = numArray[i] - 1;
    const position = (index % 32) * 2;
    const mask = BigInt(~(3n << BigInt(position)));
    newState = (newState & mask) | (BigInt(statusArray[i]) << BigInt(position));
  }

  return ethers.utils.hexZeroPad(BigNumber.from(newState).toHexString(), 32);
};

describe("Round", function () {
  async function deployRoundFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Round = await ethers.getContractFactory("Round");
    const round = await Round.deploy();

    return { round, owner, otherAccount };
  }

  describe("Apply to round", function () {
    it("Should add projects to projectIds array", async function () {
      const { round, owner, otherAccount } = await loadFixture(
        deployRoundFixture
      );

      const projectId = getProjectId("1");
      await round.applyToRound(projectId);

      const projectId2 = getProjectId("2");
      await round.applyToRound(projectId2);

      expect(await round.projectIds(0)).to.equal(projectId);
      expect(await round.projectIds(1)).to.equal(projectId2);
    });

    it("Should count the projects correct", async function () {
      const { round, owner, otherAccount } = await loadFixture(
        deployRoundFixture
      );

      const projectId = getProjectId("1");
      await round.applyToRound(projectId);

      const projectId2 = getProjectId("2");
      await round.applyToRound(projectId2);

      expect(await round.projectNum(projectId)).to.equal(1);
      expect(await round.projectNum(projectId2)).to.equal(2);
    });

    it("should have pending status after applying", async function () {
      const { round, owner, otherAccount } = await loadFixture(
        deployRoundFixture
      );

      const projectId = getProjectId("1");
      await round.applyToRound(projectId);

      const projectId2 = getProjectId("2");
      await round.applyToRound(projectId2);

      expect(await round.getStatus(projectId)).to.equal(STATUS.PENDING);
      expect(await round.getStatus(projectId2)).to.equal(STATUS.PENDING);
    });

    it("should return the correct status if not applied", async function () {
      const { round, owner, otherAccount } = await loadFixture(
        deployRoundFixture
      );

      expect(await round.getStatus(getProjectId(3))).to.equal(
        STATUS.NOT_APPLIED
      );
    });

    it("should update the status to accepted and rejected", async function () {
      const { round, owner, otherAccount } = await loadFixture(
        deployRoundFixture
      );

      const projectId = getProjectId("1");
      await round.applyToRound(projectId);

      const projectId2 = getProjectId("2");
      await round.applyToRound(projectId2);

      const currentStates = await round.projectStates(0);
      const newStates = buildNewState(
        currentStates.toString(),
        [projectId, projectId2],
        [1, 2],
        [STATUS.ACCEPTED, STATUS.REJECTED],
      );

      await round.setProjectStates([0], [newStates]);

      expect(await round.getStatus(projectId)).to.equal(STATUS.ACCEPTED);
      expect(await round.getStatus(projectId2)).to.equal(STATUS.REJECTED);
    });

    it("should reset a project status to pending", async function () {
      const { round, owner, otherAccount } = await loadFixture(
        deployRoundFixture
      );

      const projectId = getProjectId("1");
      await round.applyToRound(projectId);

      const currentStates = await round.projectStates(0);
      const newStates = buildNewState(
        currentStates.toString(),
        [projectId],
        [1],
        [STATUS.ACCEPTED],
      );

      await round.setProjectStates([0], [newStates]);

      expect(await round.getStatus(projectId)).to.equal(STATUS.ACCEPTED);

      await round.applyToRound(projectId);

      expect(await round.getStatus(projectId)).to.equal(STATUS.PENDING);
    });

    it("should add new state slot after 128 projects were added", async function () {
      const { round, owner, otherAccount } = await loadFixture(
        deployRoundFixture
      );

      for (let i = 0; i <= 128; i++) {
        const projectId = getProjectId(i.toString());
        await round.applyToRound(projectId);
      }

      
      expect(await round.getProjectStateLength()).to.equal(2);
     });
  });
});
