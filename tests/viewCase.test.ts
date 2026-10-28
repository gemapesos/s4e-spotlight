import { describe, expect, it, vi } from "vitest"

import {
  VIEW_CASE_SIGN_IN_ERROR,
  caseScrapeFileName,
  scrapeCases,
} from "../src/lib/viewCase"

const CASE_ID = "22420938051"
const TIME_ZONE = "Asia/Manila"
const SCRAPED_AT = new Date("2026-10-22T11:01:00.000Z")
const DENIAL = "We&#39;re denying your reimbursement claim. Go to &#34;FBA inventory reimbursement policy&#34;: https://sellercentral.amazon.com/help?a=1&amp;b=2"
const DECODED_DENIAL = "We're denying your reimbursement claim. Go to \"FBA inventory reimbursement policy\": https://sellercentral.amazon.com/help?a=1&b=2"
const OPENING = "Shipment ID FBA199VH4PWY requires further investigation. Please investigate."

const PAGE_ONE_TIMESTAMPS = [
  1792655737.098,
  1792582423.51,
  1792139716.084,
  1792065014.569,
  1791889429.015,
  1791805987.402,
  1791544105.021,
  1791460255.867,
  1791288125.13,
  1791200721.995,
]
const OLDEST_TIMESTAMP = 1791199314.925

function contact(
  id: string,
  timestamp: number,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return {
    attachments: null,
    channelType: "EMAIL",
    contactId: id,
    expired: false,
    hmdContact: false,
    hmdMetaData: null,
    message,
    messageList: null,
    messageTruncated: false,
    outbound: false,
    parentContact: null,
    sender: "accountmaintenance@solutions4ecommerce.com",
    timestamp,
    ...extra,
  }
}

function viewCasePage(contacts: unknown[], currentToken: string | null, total = 11) {
  return {
    appointmentMetadata: null,
    contactList: contacts,
    currentToken,
    liveConversation: null,
    totalNumberOfContacts: total,
    viewCaseMetaData: {
      canEditCase: true,
      caseStatus: "Resolved",
      caseSupportType: null,
      caseTags: null,
      caseTitle: "Investigate the Inventory Discrepancy in Shipment ID: FBA199VH4PWY",
      ccList: [],
      creationDate: 1791199314.913,
      crmType: "CASE",
      escalateMotivationId: null,
      escalated: false,
      primaryEmail: "accountmaintenance@solutions4ecommerce.com",
      transfer: false,
    },
  }
}

function pageOne() {
  return viewCasePage([
    contact("ekko:us-east-1:87d5f417-c35f-4196-b660-362cca988f2f", PAGE_ONE_TIMESTAMPS[0], DENIAL, {
      hmdContact: true,
      hmdMetaData: {
        beforeHMDContent: DENIAL,
        afterHMDContent: "Thank you for selling with Amazon.",
        hmdType: "TwoPoint",
      },
      outbound: true,
      sender: "Amazon",
    }),
    ...PAGE_ONE_TIMESTAMPS.slice(1).map((timestamp, index) => contact(
      `ekko:us-east-1:page-1-${index + 2}`,
      timestamp,
      `Follow-up ${index + 2}`,
    )),
  ], "next-page")
}

function pageTwo(currentToken: string | null = null) {
  return viewCasePage([
    contact("ekko:us-east-1:f53af29c-a1b4-4980-bed4-543eacdb6f3a", OLDEST_TIMESTAMP, OPENING),
  ], currentToken)
}

function jsonResponse(body: unknown, status = 200, contentType = "application/json"): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": contentType },
  })
}

function fetchPages(pages: Record<string, unknown>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    const token = new URL(url).searchParams.get("currentToken") ?? ""
    const page = pages[token]
    if (!page) throw new Error(`unexpected token ${token}`)
    return jsonResponse(page)
  })
}

describe("scrapeCases", () => {
  it("walks every page and keeps the whole thread, oldest first", async () => {
    const fetchImpl = fetchPages({ "": pageOne(), "next-page": pageTwo() })

    const file = await scrapeCases(fetchImpl, [CASE_ID], { timeZone: TIME_ZONE, now: SCRAPED_AT })

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("caseId=22420938051"),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        referrer: "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=22420938051",
        headers: expect.objectContaining({
          accept: "application/json, text/plain, */*",
          "client-id": "viewCase",
          "anti-csrftoken-a2z-request": "true",
          "origin-referrer": "https://sellercentral.amazon.com/cu/case-dashboard/view-case",
        }),
      }),
    )
    expect(fetchImpl.mock.calls[0][0]).toContain("timeZone=Asia%2FManila")
    expect(fetchImpl.mock.calls[0][0]).toContain("pageSize=10")
    expect(fetchImpl.mock.calls[0][0]).not.toContain("currentToken")
    expect(fetchImpl.mock.calls[1][0]).toContain("currentToken=next-page")
    expect(file).toMatchObject({
      scrapedAt: "2026-10-22T11:01:00.000Z",
      timeZone: TIME_ZONE,
      cases: [{
        caseId: CASE_ID,
        caseUrl: "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=22420938051",
        totalNumberOfContacts: 11,
        appointmentMetadata: null,
        liveConversation: null,
        viewCaseMetaData: {
          caseStatus: "Resolved",
          caseTitle: "Investigate the Inventory Discrepancy in Shipment ID: FBA199VH4PWY",
          creationDate: 1791199314.913,
          creationDateIso: "2026-10-05T19:21:54.913+08:00",
          primaryEmail: "accountmaintenance@solutions4ecommerce.com",
          ccList: [],
        },
      }],
    })
    expect(file.errors).toBeUndefined()
    const contacts = file.cases[0].contacts
    expect(contacts).toHaveLength(11)
    expect(contacts[0]).toMatchObject({
      contactId: "ekko:us-east-1:f53af29c-a1b4-4980-bed4-543eacdb6f3a",
      message: OPENING,
      timestamp: OLDEST_TIMESTAMP,
      timestampIso: "2026-10-05T19:21:54.925+08:00",
      channelType: "EMAIL",
      sender: "accountmaintenance@solutions4ecommerce.com",
      outbound: false,
      attachments: null,
      messageTruncated: false,
    })
    expect(contacts[10]).toMatchObject({
      sender: "Amazon",
      outbound: true,
      message: DECODED_DENIAL,
      timestamp: PAGE_ONE_TIMESTAMPS[0],
      timestampIso: "2026-10-22T15:55:37.098+08:00",
      hmdMetaData: {
        beforeHMDContent: DECODED_DENIAL,
        hmdType: "TwoPoint",
      },
    })
    expect(contacts.map((item) => item.timestamp)).toEqual([...contacts.map((item) => item.timestamp)].sort((a, b) => Number(a) - Number(b)))
  })

  it("stops when the next token is null", async () => {
    const fetchImpl = fetchPages({ "": pageOne(), "next-page": pageTwo(null) })

    await scrapeCases(fetchImpl, [CASE_ID], { timeZone: TIME_ZONE, now: SCRAPED_AT })

    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("stops on a repeated token and fails a short thread", async () => {
    const fetchImpl = fetchPages({
      "": viewCasePage([contact("only", PAGE_ONE_TIMESTAMPS[0], "SECRET_REPLY")], "loop", 11),
      loop: viewCasePage([], "loop", 11),
    })

    const file = await scrapeCases(fetchImpl, [CASE_ID], { timeZone: TIME_ZONE, now: SCRAPED_AT })

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(file.cases).toEqual([])
    expect(file.errors).toEqual([{ caseId: CASE_ID, error: "Couldn’t load the whole case." }])
    expect(file.errors?.[0].error).not.toContain("SECRET_REPLY")
  })

  it("fails when a finished page is still short of the contact count", async () => {
    const fetchImpl = fetchPages({
      "": viewCasePage([contact("only", OLDEST_TIMESTAMP, "SECRET_REPLY")], null, 11),
    })

    const file = await scrapeCases(fetchImpl, [CASE_ID], { timeZone: TIME_ZONE, now: SCRAPED_AT })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(file.cases).toEqual([])
    expect(file.errors).toEqual([{ caseId: CASE_ID, error: "Couldn’t load the whole case." }])
  })

  it("drops a repeated contact id", async () => {
    const repeated = contact("same", OLDEST_TIMESTAMP, "Once")
    const fetchImpl = fetchPages({
      "": viewCasePage([repeated, { ...repeated }], null, 1),
    })

    const file = await scrapeCases(fetchImpl, [CASE_ID], { timeZone: TIME_ZONE, now: SCRAPED_AT })

    expect(file.cases[0].contacts).toHaveLength(1)
    expect(file.cases[0].contacts[0].contactId).toBe("same")
    expect(file.errors).toBeUndefined()
  })

  it("records a sign-in failure and still keeps cases that loaded", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
      const caseId = new URL(url).searchParams.get("caseId")
      if (caseId === CASE_ID) return jsonResponse(viewCasePage([
        contact("only", OLDEST_TIMESTAMP, OPENING),
      ], null, 1))
      return new Response("<html>sign in</html>", { status: 200, headers: { "content-type": "text/html;charset=UTF-8" } })
    })

    const file = await scrapeCases(fetchImpl, [CASE_ID, "11111111111"], { timeZone: TIME_ZONE, now: SCRAPED_AT })

    expect(file.cases.map((item) => item.caseId)).toEqual([CASE_ID])
    expect(file.errors).toEqual([{ caseId: "11111111111", error: VIEW_CASE_SIGN_IN_ERROR }])
  })
})

describe("caseScrapeFileName", () => {
  it("names one case from its id and several from the count and day", () => {
    const date = new Date(2026, 9, 22)
    expect(caseScrapeFileName([CASE_ID], date)).toBe("case-22420938051.json")
    expect(caseScrapeFileName([CASE_ID, "11111111111"], date)).toBe("cases-2-2026-10-22.json")
  })
})
