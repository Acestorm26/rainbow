import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { Centered, RowWithMargins } from '../layout';
import { DollarFigure, Text } from '../text';
import { padding } from '@rainbow-me/styles';

const SavingsSheetHeader = ({ balance, lifetimeAccruedInterest }) => {
  const { colors } = useTheme();
  return (
    <Centered css={padding(17, 0, 8)} direction="column">
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        letterSpacing="uppercase"
        size="smedium"
        uppercase
        weight="semibold"
      >
        {lang.t('savings.label')}
      </Text>
      <DollarFigure decimals={2} value={balance} />
      <RowWithMargins align="center" margin={4} marginTop={1}>
        <Text
          align="center"
          color={colors.green}
          lineHeight="loose"
          size="large"
          weight="bold"
        >
          Earned {lifetimeAccruedInterest}
        </Text>
      </RowWithMargins>
    </Centered>
  );
};

SavingsSheetHeader.propTypes = {
  balance: PropTypes.string,
  lifetimeAccruedInterest: PropTypes.string,
};

export default SavingsSheetHeader;
