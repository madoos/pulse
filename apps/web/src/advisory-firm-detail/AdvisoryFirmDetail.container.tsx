import { backHref } from '@shared/navigation/firmLink';
import { useLocation, useParams } from 'react-router';
import { AdvisoryFirmDetail } from './AdvisoryFirmDetail';

export const AdvisoryFirmDetailContainer = () => {
  const { id = '' } = useParams();
  const { state } = useLocation();
  return <AdvisoryFirmDetail id={id} backTo={backHref(state)} />;
};
