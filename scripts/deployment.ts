import { ethers } from 'hardhat'

import '@nomiclabs/hardhat-ethers'
import { deployAllContracts } from './deploymentUtils'

// 90% of Geth's 128KB tx size limit, leaving ~13KB for proving
// This need to be adjusted for Orbit chains
if (!process.env.MAX_DATA_SIZE)
  throw "missing MAX_DATA_SIZE"
const maxDataSize = process.env.MAX_DATA_SIZE

const NUM_RETRIES = 10

async function withRetry(
  f: () => Promise<ethers.providers.TransactionResponse>,
): Promise<ethers.providers.TransactionResponse> {
  for (let tries = 0; tries < NUM_RETRIES; tries++) {
    try {
      const tx = await f();
      console.log(`Sent transaction: ${tx.hash}`);
      await tx.wait();
      return tx;
    } catch (e) {
      console.error(`Failed to send transaction: ${(e as Error).message}`);
    }
  }
  throw new Error('Failed to send transaction');
}

async function sendTransaction(
  transaction: ethers.providers.TransactionRequest,
): Promise<ethers.providers.TransactionResponse> {
  return await withRetry(async () =>
    this._sendTransaction({
      ...transaction,
      nonce: await this.getTransactionCount(),
      gasPrice: (await this.getGasPrice()).mul(15).div(10),
    }),
  )
}

async function main() {
  const [signer] = await ethers.getSigners()
  signer._sendTransaction = signer.sendTransaction
  signer.sendTransaction = sendTransaction

  try {
    // Deploying all contracts
    const contracts = await deployAllContracts(
      signer,
      ethers.BigNumber.from(maxDataSize),
      true
    )

    // Call setTemplates with the deployed contract addresses
    console.log('Waiting for the Template to be set on the Rollup Creator')
    await contracts.rollupCreator.setTemplates(
      contracts.bridgeCreator.address,
      contracts.osp.address,
      contracts.challengeManager.address,
      contracts.rollupAdmin.address,
      contracts.rollupUser.address,
      contracts.upgradeExecutor.address,
      contracts.validatorUtils.address,
      contracts.validatorWalletCreator.address,
      contracts.deployHelper.address
    )
    console.log('Template is set on the Rollup Creator')
  } catch (error) {
    console.error(
      'Deployment failed:',
      error instanceof Error ? error.message : error
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error)
    process.exit(1)
  })