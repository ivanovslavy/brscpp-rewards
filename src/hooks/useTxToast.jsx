import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { ArrowTopRightOnSquareIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const GMBERSCAN = 'https://testnet.gembascan.io';

export function useTxToast() {
  const execute = useCallback(async (txFactory, messages = {}) => {
    const {
      pending = 'Waiting for wallet...',
      success = 'Transaction confirmed',
      errorPrefix = 'Transaction failed',
    } = messages;

    const toastId = toast.loading(
      <div className="flex flex-col gap-1">
        <div className="font-medium">{pending}</div>
        <div className="text-xs opacity-70">Confirm in your wallet</div>
      </div>,
      {
        style: {
          background: 'var(--card-bg)',
          border: '1px solid rgba(37, 99, 235, 0.3)',
          color: 'var(--text-primary)'
        }
      }
    );

    try {
      const tx = await txFactory();

      toast.loading(
        <div className="flex flex-col gap-1">
          <div className="font-medium">{pending}</div>
          <a
            href={`${ETHERSCAN}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs inline-flex items-center gap-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
          </a>
        </div>,
        {
          id: toastId,
          style: {
            background: 'var(--card-bg)',
            border: '1px solid rgba(37, 99, 235, 0.4)',
            color: 'var(--text-primary)'
          }
        }
      );

      const receipt = await tx.wait();

      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-medium">{success}</div>
          <a
            href={`${ETHERSCAN}/tx/${receipt.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs inline-flex items-center gap-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            View on GembaScan
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
          </a>
        </div>,
        {
          id: toastId,
          duration: 8000,
          icon: <CheckCircleIcon className="w-5 h-5" style={{ color: '#10b981' }} />,
          style: {
            background: 'var(--card-bg)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: 'var(--text-primary)'
          }
        }
      );
      return receipt;
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || 'Unknown error';
      const shortMsg = msg.length > 100 ? msg.slice(0, 97) + '...' : msg;

      toast.error(
        <div className="flex flex-col gap-1">
          <div className="font-medium">{errorPrefix}</div>
          <div className="text-xs opacity-80">{shortMsg}</div>
        </div>,
        {
          id: toastId,
          duration: 6000,
          icon: <XCircleIcon className="w-5 h-5" style={{ color: '#ef4444' }} />,
          style: {
            background: 'var(--card-bg)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: 'var(--text-primary)'
          }
        }
      );
      return null;
    }
  }, []);

  return { execute };
}
