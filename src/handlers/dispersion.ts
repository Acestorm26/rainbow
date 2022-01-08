import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress, RainbowToken } from '@rainbow-me/entities';
import UniswapAssetsCache from '@rainbow-me/utils/uniswapAssetsCache';

const dispersionApi = new RainbowFetchClient({
  baseURL: 'http://localhost:8080',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const getUniswapV2Pools = async (token?: EthereumAddress) => {
  const tokenPath = token ? `/${token}` : '';
  return await dispersionApi.get(`/dispersion/v1/pools/uniswap/v2${tokenPath}`);
};

export const getUniswapV2Tokens = async (
  addresses: EthereumAddress[]
): Promise<RainbowToken[]> => {
  const key = addresses.join(',');
  if (UniswapAssetsCache.cache[key]) {
    return UniswapAssetsCache.cache[key];
  } else {
    const res = await dispersionApi.post('/dispersion/v1/tokens/uniswap/v2', {
      addresses,
    });
    UniswapAssetsCache.cache[key] = [...res?.data?.tokens];
    return res?.data?.tokens;
  }
};

export const getDPIBalance = async () => {
  const res = await dispersionApi.get('/dispersion/v1/dpi');
  return res?.data?.data;
};

export const getTrendingAddresses = async () => {
  const res = await dispersionApi.get('/dispersion/v1/trending');
  return res?.data?.data?.trending || [];
};

export const getAdditionalAssetData = async (address: EthereumAddress) => {
  const res = await dispersionApi.get(`/dispersion/v1/expanded/${address}`);
  return res?.data?.data;
};

export const getCoingeckoIds = async () => {
  const res = await dispersionApi.get('/dispersion/v1/coingecko/ids');
  return res?.data?.data?.ids;
};
