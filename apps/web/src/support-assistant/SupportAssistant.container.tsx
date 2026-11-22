import { useAppDispatch, useAppSelector } from '@app/store';
import { useEffect } from 'react';
import { SupportAssistant } from './SupportAssistant';
import {
  assistantClosed,
  assistantOpened,
  conversationRequested,
  questionAsked,
} from './supportAssistant.slice';

/** The support assistant of the firm of the page (ADR-0023). */
export const SupportAssistantContainer = ({
  firmId,
  firmName,
}: {
  firmId: number;
  firmName: string;
}) => {
  const {
    isOpen,
    firmId: assistantFirmId,
    conversation,
    exchanges,
  } = useAppSelector((s) => s.supportAssistant);
  const dispatch = useAppDispatch();
  const isThisFirm = assistantFirmId === firmId;

  // The conversation starts the first time the window opens for the firm.
  useEffect(() => {
    if (isOpen && isThisFirm && conversation.status === 'idle') {
      dispatch(conversationRequested(firmId));
    }
  }, [isOpen, isThisFirm, conversation.status, firmId, dispatch]);

  // Leaving the page closes the window and cancels what is on its way.
  useEffect(() => () => void dispatch(assistantClosed()), [dispatch]);

  return (
    <SupportAssistant
      firmName={firmName}
      isOpen={isOpen && isThisFirm}
      conversationStatus={isThisFirm ? conversation.status : 'idle'}
      exchanges={isThisFirm ? exchanges : []}
      onOpen={() => dispatch(assistantOpened(firmId))}
      onClose={() => dispatch(assistantClosed())}
      onAsk={(question) => {
        if (conversation.id) {
          dispatch(questionAsked({ firmId, conversationId: conversation.id, question }));
        }
      }}
    />
  );
};
