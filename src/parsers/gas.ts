import BigNumber from 'bignumber.js';
import { map, zipObject } from 'lodash';
import { gasUtils } from '../utils';
import {
  ConfirmationBlocks,
  ConfirmationBlocksByBaseFee,
  ConfirmationBlocksByPriorityFee,
  GasFeeParam,
  GasFeeParams,
  GasFeeParamsBySpeed,
  GasFeesBySpeed,
  GasPricesAPIData,
  LegacyGasFeeParams,
  LegacyGasFeeParamsBySpeed,
  LegacyGasFeesBySpeed,
  LegacySelectedGasFee,
  MaxPriorityFeeSuggestions,
  Numberish,
  RainbowMeteorologyData,
  SelectedGasFee,
} from '@rainbow-me/entities';
import { toHex } from '@rainbow-me/handlers/web3';
import { Network } from '@rainbow-me/helpers/networkTypes';
import { getMinimalTimeUnitStringForMs } from '@rainbow-me/helpers/time';
import { ethUnits, timeUnits } from '@rainbow-me/references';
import {
  add,
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  divide,
  greaterThan,
  lessThan,
  multiply,
  toFixedDecimals,
} from '@rainbow-me/utilities';

type BigNumberish = number | string | BigNumber;

const { CUSTOM, FAST, GasSpeedOrder, NORMAL, URGENT } = gasUtils;

const getBaseFeeMultiplier = (speed: string) => {
  switch (speed) {
    case URGENT:
      return 1.1;
    case FAST:
      return 1.05;
    case NORMAL:
    default:
      return 1;
  }
};
const parseOtherL2GasPrices = (data: GasPricesAPIData) => ({
  [FAST]: defaultGasPriceFormat(FAST, data.avgWait, data.average),
  [NORMAL]: defaultGasPriceFormat(NORMAL, data.avgWait, data.average),
  [URGENT]: defaultGasPriceFormat(URGENT, data.fastWait, data.fast),
});

const parseGasDataConfirmationTime = (
  maxBaseFee: string,
  maxPriorityFee: string,
  confirmationBlocksByPriorityFee: ConfirmationBlocksByPriorityFee,
  confirmationBlocksByBaseFee: ConfirmationBlocksByBaseFee
) => {
  let blocksToWaitForPriorityFee = 0;
  let blocksToWaitForBaseFee = 0;

  if (lessThan(maxPriorityFee, confirmationBlocksByPriorityFee[1])) {
    blocksToWaitForPriorityFee += 1;
  } else if (lessThan(maxPriorityFee, confirmationBlocksByPriorityFee[2])) {
    blocksToWaitForPriorityFee += 2;
  } else if (lessThan(maxPriorityFee, confirmationBlocksByPriorityFee[3])) {
    blocksToWaitForPriorityFee += 3;
  } else if (lessThan(maxPriorityFee, confirmationBlocksByPriorityFee[4])) {
    blocksToWaitForPriorityFee += 4;
  }

  if (lessThan(confirmationBlocksByBaseFee[4], maxBaseFee)) {
    blocksToWaitForBaseFee += 1;
  } else if (lessThan(confirmationBlocksByBaseFee[8], maxBaseFee)) {
    blocksToWaitForBaseFee += 4;
  } else if (lessThan(confirmationBlocksByBaseFee[40], maxBaseFee)) {
    blocksToWaitForBaseFee += 8;
  } else if (lessThan(confirmationBlocksByBaseFee[120], maxBaseFee)) {
    blocksToWaitForBaseFee += 40;
  } else if (lessThan(confirmationBlocksByBaseFee[240], maxBaseFee)) {
    blocksToWaitForBaseFee += 120;
  } else {
    blocksToWaitForBaseFee += 240;
  }

  const totalBlocksToWait =
    blocksToWaitForBaseFee > 4
      ? blocksToWaitForBaseFee
      : blocksToWaitForBaseFee + blocksToWaitForPriorityFee;
  let timeAmount = 15 * totalBlocksToWait;

  return {
    amount: timeAmount,
    display: getMinimalTimeUnitStringForMs(
      multiply(timeAmount, timeUnits.ms.second)
    ),
  };
};

export const parseRainbowMeteorologyData = (
  rainbowMeterologyData: RainbowMeteorologyData
): {
  gasFeeParamsBySpeed: GasFeeParamsBySpeed;
  baseFeePerGas: GasFeeParam;
  baseFeeTrend: number;
  currentBaseFee: GasFeeParam;
  confirmationBlocks: ConfirmationBlocks;
} => {
  const {
    baseFeeSuggestion,
    baseFeeTrend,
    maxPriorityFeeSuggestions,
    confirmationTimeByPriorityFee,
    currentBaseFee,
  } = rainbowMeterologyData.data;

  // API compatible
  let confirmationBlocks: ConfirmationBlocks;
  if (!rainbowMeterologyData.data.confirmationBlocks) {
    const confirmationBlocksByPriorityFee: ConfirmationBlocksByPriorityFee = {
      1: confirmationTimeByPriorityFee[15],
      2: confirmationTimeByPriorityFee[30],
      3: confirmationTimeByPriorityFee[45],
      4: confirmationTimeByPriorityFee[60],
    };
    const confirmationBlocksByBaseFee: ConfirmationBlocksByBaseFee = {
      120: new BigNumber(multiply(baseFeeSuggestion, 0.75)).toFixed(0),
      240: new BigNumber(multiply(baseFeeSuggestion, 0.72)).toFixed(0),
      4: new BigNumber(multiply(baseFeeSuggestion, 0.92)).toFixed(0),
      40: new BigNumber(multiply(baseFeeSuggestion, 0.79)).toFixed(0),
      8: new BigNumber(multiply(baseFeeSuggestion, 0.88)).toFixed(0),
    };
    confirmationBlocks = {
      confirmationBlocksByBaseFee,
      confirmationBlocksByPriorityFee,
    };
  } else {
    confirmationBlocks = rainbowMeterologyData.data.confirmationBlocks;
  }

  const parsedFees: GasFeeParamsBySpeed = {};
  const parsedCurrentBaseFee = parseGasFeeParam(currentBaseFee);
  const parsedBaseFeeSuggestion = parseGasFeeParam(baseFeeSuggestion);
  const {
    confirmationBlocksByPriorityFee,
    confirmationBlocksByBaseFee,
  } = confirmationBlocks;

  Object.keys(maxPriorityFeeSuggestions).forEach(speed => {
    const baseFeeMultiplier = getBaseFeeMultiplier(speed);
    const speedMaxBaseFee = toFixedDecimals(
      multiply(baseFeeSuggestion, baseFeeMultiplier),
      0
    );
    const maxPriorityFee =
      maxPriorityFeeSuggestions[speed as keyof MaxPriorityFeeSuggestions];
    // next version of the package will send only 2 decimals
    const cleanMaxPriorityFee = gweiToWei(
      new BigNumber(weiToGwei(maxPriorityFee)).toFixed(2)
    );
    // clean max base fee to only parser int gwei
    const cleanMaxBaseFee = gweiToWei(
      new BigNumber(weiToGwei(speedMaxBaseFee)).toFixed(0)
    );
    parsedFees[speed] = {
      estimatedTime: parseGasDataConfirmationTime(
        cleanMaxBaseFee,
        cleanMaxPriorityFee,
        confirmationBlocksByPriorityFee,
        confirmationBlocksByBaseFee
      ),
      maxFeePerGas: parseGasFeeParam(cleanMaxBaseFee),
      maxPriorityFeePerGas: parseGasFeeParam(cleanMaxPriorityFee),
      option: speed,
    };
  });

  parsedFees[CUSTOM] = {} as GasFeeParams;
  return {
    baseFeePerGas: parsedBaseFeeSuggestion,
    baseFeeTrend,
    confirmationBlocks,
    currentBaseFee: parsedCurrentBaseFee,
    gasFeeParamsBySpeed: parsedFees,
  };
};

const parseGasPricesPolygonGasStation = (data: GasPricesAPIData) => {
  const polygonGasPriceBumpFactor = 1.05;
  return {
    [FAST]: defaultGasPriceFormat(
      FAST,
      0.5,
      Math.ceil(Number(data.fast) * polygonGasPriceBumpFactor)
    ),
    [NORMAL]: defaultGasPriceFormat(
      NORMAL,
      1,
      Math.ceil(Number(data.average) * polygonGasPriceBumpFactor)
    ),
    [URGENT]: defaultGasPriceFormat(
      URGENT,
      0.2,
      Math.ceil(Number(data.fastest) * polygonGasPriceBumpFactor)
    ),
  };
};

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {String} network
 */
export const parseL2GasPrices = (
  data: GasPricesAPIData,
  network: Network
): LegacyGasFeeParamsBySpeed | null => {
  if (!data) return null;
  switch (network) {
    case Network.polygon:
      return parseGasPricesPolygonGasStation(data);
    case Network.arbitrum:
    case Network.optimism:
    default:
      return parseOtherL2GasPrices(data);
  }
};

export const defaultGasPriceFormat = (
  option: string,
  timeWait: Numberish,
  value: Numberish
): LegacyGasFeeParams => {
  const timeAmount = multiply(timeWait, timeUnits.ms.minute);
  const weiAmount = multiply(value, ethUnits.gwei);
  return {
    estimatedTime: {
      amount: Number(timeAmount),
      display: getMinimalTimeUnitStringForMs(timeAmount),
    },
    gasPrice: {
      amount: weiAmount,
      display: `${toFixedDecimals(value, 0)} Gwei`,
      gwei: toFixedDecimals(value, 0),
    },
    option,
  };
};

/**
 * Transform wei gas value into a `GasFeeParam` object
 * @param weiAmount - Gas value in wei unit
 * @returns
 */
export const parseGasFeeParam = (weiAmount: string): GasFeeParam => {
  return {
    amount: weiAmount,
    display: `${parseInt(weiToGwei(weiAmount), 10)} Gwei`,
    gwei: weiToGwei(weiAmount),
  };
};

/**
 * Transform EIP1559 params into a `GasFeeParams` object
 * @param option - Speed option
 * @param maxFeePerGas - `maxFeePerGas` value in gwei unit
 * @param maxPriorityFeePerGas - `maxPriorityFeePerGas` value in gwei unit
 * @param confirmationTimeByPriorityFee - ConfirmationTimeByPriorityFee object
 * @returns GasFeeParams
 */
export const defaultGasParamsFormat = (
  option: string,
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  confirmationBlocksByPriorityFee: ConfirmationBlocksByPriorityFee,
  confirmationBlocksByBaseFee: ConfirmationBlocksByBaseFee
): GasFeeParams => {
  const time = parseGasDataConfirmationTime(
    maxFeePerGas,
    maxPriorityFeePerGas,
    confirmationBlocksByPriorityFee,
    confirmationBlocksByBaseFee
  );
  return {
    estimatedTime: time,
    maxFeePerGas: parseGasFeeParam(maxFeePerGas),
    maxPriorityFeePerGas: parseGasFeeParam(maxPriorityFeePerGas),
    option,
  };
};

/**
 * @desc parse ether gas prices with updated gas limit
 * @param {Object} data
 * @param {Object} prices
 * @param {Number} gasLimit
 */
export const parseLegacyGasFeesBySpeed = (
  legacyGasFees: LegacyGasFeeParamsBySpeed,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string,
  l1GasFeeOptimism: BigNumber | null = null
): LegacyGasFeesBySpeed => {
  const gasFeesBySpeed = map(GasSpeedOrder, speed => {
    const gasPrice = legacyGasFees?.[speed]?.gasPrice?.amount || 0;
    const estimatedFee = getTxFee(
      gasPrice,
      gasLimit,
      priceUnit,
      nativeCurrency,
      l1GasFeeOptimism
    );
    return {
      estimatedFee,
    };
  });
  return zipObject(GasSpeedOrder, gasFeesBySpeed);
};

export const parseGasFees = (
  gasFeeParams: GasFeeParams,
  baseFeePerGas: GasFeeParam,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string
) => {
  const { maxPriorityFeePerGas, maxFeePerGas } = gasFeeParams || {};
  const priorityFee = maxPriorityFeePerGas?.amount || 0;
  const maxFeePerGasAmount = maxFeePerGas?.amount || 0;
  const baseFeePerGasAmount = baseFeePerGas?.amount || 0;

  // if user sets the max base fee to lower than the current base fee
  const estimatedFeePerGas = greaterThan(
    maxFeePerGasAmount,
    baseFeePerGasAmount
  )
    ? baseFeePerGasAmount
    : maxFeePerGasAmount;

  const maxFee = getTxFee(
    add(maxFeePerGasAmount, priorityFee),
    gasLimit,
    priceUnit,
    nativeCurrency
  );
  const estimatedFee = getTxFee(
    add(estimatedFeePerGas, priorityFee),
    gasLimit,
    priceUnit,
    nativeCurrency
  );
  return {
    estimatedFee,
    maxFee,
  };
};

export const parseGasFeesBySpeed = (
  gasFeeParamsBySpeed: GasFeeParamsBySpeed,
  baseFeePerGas: GasFeeParam,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string
): GasFeesBySpeed => {
  const gasFeesBySpeed = map(GasSpeedOrder, speed =>
    parseGasFees(
      gasFeeParamsBySpeed[speed],
      baseFeePerGas,
      gasLimit,
      priceUnit,
      nativeCurrency
    )
  );
  return zipObject(GasSpeedOrder, gasFeesBySpeed);
};

const getTxFee = (
  gasPrice: BigNumberish,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string,
  l1GasFeeOptimism: BigNumber | null = null
) => {
  let amount = multiply(gasPrice, gasLimit);
  if (l1GasFeeOptimism && greaterThan(l1GasFeeOptimism.toString(), '0')) {
    amount = add(amount, l1GasFeeOptimism.toString());
  }

  return {
    native: {
      value: convertRawAmountToNativeDisplay(
        amount,
        18,
        priceUnit,
        nativeCurrency
      ),
    },
    value: {
      amount,
      display: convertRawAmountToBalance(amount, {
        decimals: 18,
      }),
    },
  };
};

export const parseGasParamsForTransaction = (
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee
) => {
  const legacyGasFeeParams = (selectedGasFee as LegacySelectedGasFee)
    .gasFeeParams;
  const gasPrice = legacyGasFeeParams?.gasPrice;
  if (gasPrice) {
    return { gasPrice: toHex(gasPrice.amount) };
  }
  const gasFeeParams = (selectedGasFee as SelectedGasFee).gasFeeParams;
  return {
    maxFeePerGas: toHex(gasFeeParams.maxFeePerGas.amount),
    maxPriorityFeePerGas: toHex(gasFeeParams.maxPriorityFeePerGas.amount),
  };
};

export const gweiToWei = (gweiAmount: BigNumberish) => {
  const weiAmount = multiply(gweiAmount, ethUnits.gwei);
  return weiAmount;
};

export const weiToGwei = (weiAmount: BigNumberish) => {
  const gweiAmount = divide(weiAmount, ethUnits.gwei);
  return gweiAmount;
};
