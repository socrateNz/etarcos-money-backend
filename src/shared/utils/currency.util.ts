/**
 * The app targets Central Africa: every amount shown to the user, including
 * anything the AI generates, is expressed in Franc CFA (XAF) regardless of
 * what currency a given account/user record happens to store.
 */
export const formatXaf = (amount: number): string => {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
};
