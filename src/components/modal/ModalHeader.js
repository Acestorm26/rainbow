import lang from 'i18n-js';
import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { Centered, Row } from '../layout';
import { TruncatedText } from '../text';
import ModalHeaderButton from './ModalHeaderButton';
import { borders, position } from '@rainbow-me/styles';

export const ModalHeaderHeight = 50;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
  shrink: 0,
})`
  ${borders.buildRadius('top', 20)};
  background-color: ${({ backgroundColor }) => backgroundColor};
  height: ${ModalHeaderHeight};
  width: 100%;
`;

const TitleContainer = styled(Centered)`
  ${position.cover};
  z-index: 0;
`;

export default function ModalHeader({
  onPressBack,
  onPressClose,
  showBackButton,
  showDoneButton = true,
  title,
  ...props
}) {
  const { colors } = useTheme();

  return (
    <Container backgroundColor={colors.white} {...props}>
      {showBackButton && (
        <ModalHeaderButton
          label={lang.t('settings.label')}
          onPress={onPressBack}
          side="left"
        />
      )}
      <TitleContainer>
        <TruncatedText
          align="center"
          color={colors.black}
          height={21}
          lineHeight="loose"
          size="large"
          weight="bold"
        >
          {title}
        </TruncatedText>
      </TitleContainer>
      {showDoneButton && (
        <ModalHeaderButton
          label={lang.t('settings.done')}
          onPress={onPressClose}
          side="right"
        />
      )}
    </Container>
  );
}
