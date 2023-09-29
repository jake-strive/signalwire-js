import { test, expect } from '../fixtures'
import {
  SERVER_URL,
  createTestJWTToken,
} from '../utils'
	      
test.describe('V2Calling', () => {
  test('should handle calling a pstn number then hangup', async ({
    createCustomVanillaPage,
  }) => {
    const page = await createCustomVanillaPage({ name: '[page]' })
    await page.goto(SERVER_URL + '/v2vanilla.html')

    const jwt = await createTestJWTToken({ })
    expect(jwt).not.toBe(null)

    const inpProject = page.locator('#project')
    const inpToken = page.locator('#token')
    const btnConnect = page.locator('#btnConnect')
    expect(inpProject).not.toBe(null)
    expect(inpToken).not.toBe(null)
    expect(btnConnect).not.toBe(null)

    expect(process.env.RELAY_PROJECT).not.toBe(null)

    await inpProject.fill(process.env.RELAY_PROJECT)
    await inpToken.fill(jwt)

    //await page.screenshot({ path: `screenshot_1.png` })
    await page.evaluate(() => {
      client = window.__client
      
    })
  })
})
