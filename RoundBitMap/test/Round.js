const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

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

const changeStates = (currentState, projectIdArray, numArray, statusArray) => {
  let newState = BigInt(currentState);

  for (let i = 0; i < projectIdArray.length; i++) {
    const index = numArray[i] - 1;
    const position = (index % 32) * 2;
    const mask = BigInt(~(3n << BigInt(position)));
    newState = (newState & mask) | (BigInt(statusArray[i]) << BigInt(position));
  }

  return newState;
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

      await round.changeStatus(
        [projectId, projectId2],
        [STATUS.ACCEPTED, STATUS.REJECTED]
      );

      // wip
      // const currentStates = await round.projectStates(0);
      // const newStates = changeStates(
      //   currentStates.toString(),
      //   [projectId, projectId2],
      //   [1, 2],
      //   [STATUS.ACCEPTED, STATUS.REJECTED],
      // );
      //
      // await round.setStates([0], [newStates]);

      expect(await round.getStatus(projectId)).to.equal(STATUS.ACCEPTED);
      expect(await round.getStatus(projectId2)).to.equal(STATUS.REJECTED);
    });

    it("should reset a project status to pending", async function () {
      const { round, owner, otherAccount } = await loadFixture(
        deployRoundFixture
      );

      const projectId = getProjectId("1");
      await round.applyToRound(projectId);
      await round.changeStatus([projectId], [STATUS.ACCEPTED]);

      expect(await round.getStatus(projectId)).to.equal(STATUS.ACCEPTED);

      await round.applyToRound(projectId);

      expect(await round.getStatus(projectId)).to.equal(STATUS.PENDING);
    });
  });
});
