/** Follow UX-01's actual primary and contextual navigation, including during loading. */
const parents={attention:'tasks',computers:'tasks',direct:'organization',groups:'organization',conversation:'activity',executions:'activity',audit:'activity',mandates:'products',approvals:'settings',infrastructure:'settings',devices:'settings'};
export async function go(page,tab){
 const parent=parents[tab]??tab;
 await page.locator(`.rail [data-tab="${parent}"]`).click();
 if(parent!==tab)await page.locator(`#section-nav [data-tab="${tab}"]`).click();
 await page.waitForFunction(t=>document.querySelector(`[data-tab="${t}"]`)?.getAttribute('aria-current')==='page',tab);
}
export async function aiSettings(page){
 await page.locator('#inspect summary').filter({hasText:'Advanced employee details'}).click();
 await page.locator('[data-ai-settings]').click();
}
