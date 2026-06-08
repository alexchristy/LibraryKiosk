import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
  return {
    kioskFinishDelay: Number(process.env.KIOSK_FINISH_DELAY) || 5000,
    kioskResetDelay:  Number(process.env.KIOSK_RESET_DELAY)  || 15000,
  };
};
