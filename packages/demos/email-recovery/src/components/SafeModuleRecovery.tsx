import { ConnectKitButton } from "connectkit";
import { Button } from "./Button";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { safeZkSafeZkEmailRecoveryPlugin } from "../../contracts.base-sepolia.json";
import { abi as safeAbi } from "../abi/Safe.json";
import { useCallback, useContext, useEffect, useState } from "react";
import { StepsContext } from "../App";
import { STEPS } from "../constants";


import { ethers } from "ethers";
import { EthersAdapter } from "@safe-global/protocol-kit";

import { SafeFactory } from "@safe-global/protocol-kit";


const RPC_URL = "https://sepolia.base.org";
const provider = new ethers.JsonRpcProvider(RPC_URL);

const OWNER_1_PRIVATE_KEY=import.meta.env.VITE_OWNER_1_PRIVATE_KEY

const owner1Signer = new ethers.Wallet(
  OWNER_1_PRIVATE_KEY,
  provider
);

const ethAdapterOwner1 = new EthersAdapter({
  ethers,
  signerOrProvider: owner1Signer,
});


const SafeModuleRecovery = () => {
  // const { address } = useAccount();
  const address = "0x10f2743906D2C82D2240217D0203Bc4b5fD4b228"
  const { writeContractAsync } = useWriteContract();
  const stepsContext = useContext(StepsContext);
  const [loading, setLoading] = useState(false);
  // const [address, setAddress] = useState("");

  useEffect(() => {
    // creating burner safe. This will be created everytime the app is initialized
    const createSafe = async () => {
      const safeFactory = await SafeFactory.create({
        ethAdapter: ethAdapterOwner1,
        
      });
    
      const safeAccountConfig = {
        owners: [
          await owner1Signer.getAddress(),
        ],
        threshold: 1,
      };
    
      const protocolKitOwner1 = await safeFactory.deploySafe({ safeAccountConfig, saltNonce: Date.now().toString()});
    
      const safeAddress = await protocolKitOwner1.getAddress();
    
      console.log(`Safe address ${safeAddress}`);
      // setAddress(safeAddress);
    };
    
    // createSafe();
        
  }, [owner1Signer, ethAdapterOwner1])

  useEffect(() => {
    if (!address) {
      stepsContext?.setStep(STEPS.CONNECT_WALLETS);
    }
  }, [address, stepsContext]);

  const { data: isModuleEnabled } = useReadContract({
    address,
    abi: safeAbi,
    functionName: "isModuleEnabled",
    args: [safeZkSafeZkEmailRecoveryPlugin],
  });

  console.log(isModuleEnabled);

  if (isModuleEnabled) {
    console.log("Module is enabled");
    setLoading(false);
    stepsContext?.setStep(STEPS.REQUEST_GUARDIAN);
  }

  const enableEmailRecoveryModule = useCallback(async () => {
    setLoading(true);
    if (!address) {
      throw new Error("unable to get account address");
    }

    await writeContractAsync({
      abi: safeAbi,
      address,
      functionName: "enableModule",
      args: [safeZkSafeZkEmailRecoveryPlugin],
    });
  }, [address, writeContractAsync]);

  return (
    <div style={{ display: "flex", gap: "2rem", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        Connected wallet: <ConnectKitButton />
      </div>
      {!isModuleEnabled ? (
        <Button disabled={loading} onClick={enableEmailRecoveryModule}>
          Enable Email Recovery Module
        </Button>
      ) : null}
    </div>
  );
};

export default SafeModuleRecovery;
