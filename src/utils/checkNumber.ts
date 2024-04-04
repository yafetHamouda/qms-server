export const checkPhoneNumber = (val: string) => {
  const isNum = /^\d+$/.test(val);
  return isNum;
};
