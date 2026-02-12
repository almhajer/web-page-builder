/**
 * تأخير لمدة محددة
 * @param ms - عدد المللي ثانية للتأخير
 * @returns Promise يتم حله بعد انتهاء المهلة
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
