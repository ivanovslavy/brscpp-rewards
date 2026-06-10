import { useEffect, useMemo, useState, useCallback } from 'react';
import { Contract, formatEther, formatUnits } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { useEthersSigner, useEthersProvider } from './ethersAdapter';
import { CONTRACTS, FACTORY_ABI, CONTEST_ABI } from '../contracts/hardhat-config';
import { DEFAULT_CHAIN } from '../config/wagmi';
import { tokenFor } from '../config/tokens';

// Drives the GembaWinFactory + the per-contest GembaWin clones.
export function useFactory() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const signer = useEthersSigner();
  const provider = useEthersProvider();

  const correctChain = chainId === DEFAULT_CHAIN.id;

  const factorySigner = useMemo(
    () => (signer && correctChain ? new Contract(CONTRACTS.FACTORY, FACTORY_ABI, signer) : null),
    [signer, correctChain]
  );
  const factoryRead = useMemo(
    () => (provider && correctChain ? new Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider) : null),
    [provider, correctChain]
  );

  const [role, setRole] = useState(null);
  const [stats, setStats] = useState(null);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Factory-level role: the factory owner (founder) sees Settings; everyone else is a plain user.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!factoryRead || !address || !isConnected) { setRole(null); return; }
      try {
        const isOwner = await factoryRead.isOwner(address);
        if (!cancelled) setRole(isOwner ? 'owner' : 'user');
      } catch {
        if (!cancelled) setRole('user');
      }
    }
    run();
    return () => { cancelled = true; };
  }, [factoryRead, address, isConnected]);

  const loadStats = useCallback(async () => {
    if (!factoryRead) return;
    try {
      const s = await factoryRead.getFactoryStats();
      setStats({
        totalContracts: Number(s.totalContracts),
        activeContracts: Number(s.activeContracts),
        completedContracts: Number(s.completedContracts),
        totalValueLocked: formatEther(s.totalValueLocked),
        deployFee: formatEther(s.deployFee),
        deployFeeWei: s.deployFee,
        collectedFees: formatEther(s.collectedFees),
        isPaused: s.isPaused,
        template: s.templateContract,
      });
    } catch (e) {
      console.error('loadStats error', e);
    }
  }, [factoryRead]);

  const loadContests = useCallback(async () => {
    if (!factoryRead || !provider) return;
    try {
      setLoading(true);
      const total = Number(await factoryRead.totalContracts());
      if (total === 0) { setContests([]); return; }
      const latest = await factoryRead.getLatestContracts(Math.min(20, total));
      const now = Math.floor(Date.now() / 1000);

      const list = await Promise.all(latest.map(async (c) => {
        let funded = false;
        let positions = [];
        const token = tokenFor(c.isNativeToken, c.tokenAddress);
        try {
          const contest = new Contract(c.contractAddress, CONTEST_ABI, provider);
          const info = await contest.getContestInfo();
          funded = info[3];
          const all = await contest.getAllPositions();
          positions = all[0].map((amt, i) => ({
            index: i,
            amount: formatUnits(amt, token.decimals),
            amountWei: amt,
            winner: all[1][i],
            claimed: all[2][i],
          }));
        } catch (e) { /* clone not readable yet */ }

        const deadline = Number(c.deadline);
        const claimDeadline = deadline + 30 * 24 * 3600;
        return {
          address: c.contractAddress,
          creator: c.creator,
          name: c.name,
          isNativeToken: c.isNativeToken,
          tokenAddress: c.tokenAddress,
          token,
          deadline,
          claimDeadline,
          positionCount: Number(c.positionCount),
          deployedAt: new Date(Number(c.deployedAt) * 1000),
          isActive: c.isActive,
          funded,
          positions,
          phase: now <= deadline ? 'setup' : now <= claimDeadline ? 'claiming' : 'ended',
        };
      }));
      setContests(list);
    } catch (e) {
      console.error('loadContests error', e);
    } finally {
      setLoading(false);
    }
  }, [factoryRead, provider]);

  useEffect(() => {
    if (factoryRead && provider) {
      loadStats();
      loadContests();
      const id = setInterval(() => { loadStats(); loadContests(); }, 15000);
      return () => clearInterval(id);
    }
  }, [factoryRead, provider, loadStats, loadContests]);

  return {
    chainId, correctChain, address, isConnected,
    signer, provider,
    factorySigner, factoryRead,
    role, stats, contests, loading,
    reload: () => { loadStats(); loadContests(); },
  };
}
