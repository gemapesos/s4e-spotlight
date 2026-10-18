import { describeError, type Logger } from "./log"
import type { ReportProgressEvent } from "./reportProgress"
import {
  fetchAntiCsrfTokenFromInventory,
  formatListingStatus,
  graphqlMessages,
  mapWithConcurrency,
  readAntiCsrfToken,
  UNFULFILLABLE_GQL_URL,
} from "./unfulfillable"

export const SUPPRESSED_GQL_URL = UNFULFILLABLE_GQL_URL
export const SUPPRESSED_PAGE_SIZE = 250
/**
 * Listings arrive sorted by available quantity and the scan stops at the first one out of stock,
 * so a small first page usually holds every in-stock listing without Amazon pricing 250 rows.
 */
export const SUPPRESSED_FIRST_PAGE_SIZE = 50
export const SUPPRESSED_MAX_PAGES = 40
export const SUPPRESSED_LISTINGS_INCOMPLETE_NOTE =
  "Some search-suppressed listings could not be loaded. This sheet includes only the listings that were obtainable."
export const SUPPRESSED_ISSUES_INCOMPLETE_NOTE =
  "Suppression reasons could not be loaded for some SKUs. Those rows are marked “Couldn’t load suppression reason”."
export const SUPPRESSED_ISSUE_UNAVAILABLE = "Couldn’t load suppression reason"
export const SUPPRESSED_ISSUES_CONCURRENCY = 5

export const SUPPRESSED_SHEET_HEADERS = [
  "SKU",
  "ASIN",
  "FNSKU",
  "Title",
  "Title differentiation",
  "Image URL",
  "Detail page URL",
  "SKU Central link",
  "Status",
  "Status text",
  "Highlighted state",
  "Inline action",
  "Inline action text",
  "Fix listing URL",
  "Issue",
  "Issue type",
  "Issue attribute",
  "Enforcement",
  "Issue source",
  "Issue tags",
  "Product type",
  "Listing type",
  "Bundle status",
  "Fulfillment channel",
  "Condition",
  "Sub-condition",
  "Parent ASIN",
  "Parent SKU",
  "Children",
  "Is parent",
  "Is customizable",
  "Marketplace count",
  "External IDs",
  "Favorite",
  "Tags",
  "Shipping template",
  "Shipping template ID",
  "Legacy template",
  "Date created",
  "Last updated",
  "Last 30 day GMS",
  "Last 30 day GV",
  "Last 30 day units sold",
  "Quality grade",
  "Quality grade updated",
  "Available",
  "Infinite quantity",
  "Inventory availability",
  "On hand",
  "Inbound",
  "Reserved",
  "Reserved FC transfer",
  "Reserved customer order",
  "Reserved FC processing",
  "Buyable in transit",
  "Pending customer orders in transit",
  "Unfulfillable",
  "Carrier damaged",
  "Customer damaged",
  "Defective",
  "Expired",
  "Warehouse damaged",
  "Distributor damaged",
  "Researching short term",
  "Researching mid term",
  "Researching long term",
  "FBA recommendation",
  "Fulfillment markets",
  "AA availabilities",
  "Inventory alert",
  "Days of supply",
  "Recommended inventory",
  "Price",
  "Currency",
  "Sale price",
  "Min allowed price",
  "Max allowed price",
  "Business price",
  "Quantity discount",
  "Max retail price",
  "Estimated shipping",
  "Points",
  "Automated pricing",
  "Tax rate",
  "Tax exclusive price",
  "Tax exclusive business price",
  "Lowest price",
  "Lowest shipping",
  "Buy box price",
  "Buy box shipping",
  "Sales rank",
  "Sales rank category",
  "Competitive benchmark price",
  "Competitive benchmark shipping",
  "Business program",
  "Haul offer",
  "FFO offer",
  "Non-ALL offer",
  "Actions",
  "Points Central link",
] as const

const GET_SUPPRESSED_LISTINGS_PREFIX = `fragment CurrencyFields on Currency {
  amount
  currencyUnit
  currencySymbol
  __typename
}

query getListingsV2($pagination: PaginationInput, $searchTerm: SearchTerm, $parentRecords: [String!], $multiSelectFilters: [MultiSelectFilter], $sortRequest: SortRequest, $multiSKUList: [String]) {
  listingsV2(
    pagination: $pagination
    usecase: MANAGE_INVENTORY_VIEW
    searchTerm: $searchTerm
    parentRecords: $parentRecords
    multiSelectFilters: $multiSelectFilters
    sortRequest: $sortRequest
    multiSKUList: $multiSKUList
    features: ["EML_CDQ_ENABLED"]
  ) {
    listings {
      coreListingFields {
        asin
        sku
        fnSku
        fulfillmentChannel
        __typename
      }
      listingData {
        asin
        sku
        fnSku
        productType
        bundleStatus
        externalIds {
          value
          type
          __typename
        }
        dateCreated
        lastUpdated
        parentAsin
        parentSku
        numberOfChildren
        listingType
        qualityRecommendationScore {
          grade
          lastUpdatedDate
          __typename
        }
        last30DayGms
        last30DayGv
        last30DayUnitsSold
        title
        titleDifferentiation
        __typename
      }
      annotations {
        favorite
        tagsAnnotation {
          value
          __typename
        }
        __typename
      }
      imageUrl
      detailPageUrl
      skuCentralLink
      estimatedShipping {
        ...CurrencyFields
        __typename
      }
      isCustomizable
      isParentListing
      shippingTemplate {
        Legacy
        TemplateName
        TemplateId
        __typename
      }
      marketplaceCount
      status {
        status
        statusText
        redirectionLink
        inlineAction
        inlineActionText
        highlightedState
        __typename
      }
      actions {
        __typename
        ... on ListingActionWorkflow {
          type
          displayGroup
          solutionId
          solutionParams {
            key
            value
            __typename
          }
          __typename
        }
        ... on ListingActionRedirect {
          type
          displayGroup
          isFetchRequest
          queryParams {
            key
            value
            __typename
          }
          url
          fragmentIdentifier
          __typename
        }
        ... on ListingActionAnnotation {
          type
          displayGroup
          listingAnnotations {
            favorite
            __typename
          }
          __typename
        }
        ... on ListingActionOperation {
          type
          displayGroup
          offerIds
          params {
            key
            value
            __typename
          }
          __typename
        }
      }
      availability {
        reserved {
          fcTransfer
          customerOrder
          fcProcessing
          __typename
        }
        buyableInTransit
        pendingCustomerOrdersInTransit
        quantity
        isQuantityInfinite
        inventoryAvailability
        unfulfillable
        unfulfillableDetails {
          expired
          damagedByCarrier
          damagedByCustomer
          damagedByDistributor
          damagedByWarehouse
          defective
          __typename
        }
        researching {
          shortTerm
          midTerm
          longTerm
          __typename
        }
        inbound
        onHandQuantity
        reservedQuantity
        fbaRecommendation {
          type
          attributes
          tags
          parameters {
            key
            value
            __typename
          }
          enforcementActions
          exemptionsExpiryDate
          creationTimestamp
          __typename
        }
        availabilities {
          fmid
          quantity
          fulfillmentChannelName
          isFulfilledByAmazon
          __typename
        }
        aaAvailabilities {
          quantity
          fulfillmentChannelName
          isAggregatedAvailability
          __typename
        }
        inventoryAlert {
          isThresholdReached
          threshold
          alertType
          __typename
        }
        recommendation {
          daysOfSupply
          recommendedInventory
          __typename
        }
        __typename
      }
      offers {
        offerId
        marketplace {
          marketplaceId
          defaultCountryCode
          __typename
        }
        ... on Offer3P {
          fulfillmentChannel
          businessProgram {
            value
            valueLabel
            __typename
          }
          minAllowedPrice {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          maxAllowedPrice {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          price {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          businessPrice {
            price {
              ...CurrencyFields
              __typename
            }
            percentQuantityPrice {
              quantity
              amount
              __typename
            }
            fixedQuantityPrice {
              quantity
              amount
              __typename
            }
            __typename
          }
          quantityDiscount {
            percentQuantityPrice {
              quantity
              amount
              __typename
            }
            fixedQuantityPrice {
              quantity
              amount
              __typename
            }
            __typename
          }
          salePrice {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          condition {
            condition
            subCondition
            __typename
          }
          points
          pointsLink
          automatedPricing {
            enrollmentStatus
            __typename
          }
          maxRetailPrice {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          haulOffer {
            offerId
            label
            state
            isHaulOffer
            hasHaulOffer
            haulPrice {
              price {
                ...CurrencyFields
                __typename
              }
              __typename
            }
            __typename
          }
          ffoOffer {
            offerId
            label
            state
            isFFOOffer
            ffoPrice {
              price {
                ...CurrencyFields
                __typename
              }
              __typename
            }
            __typename
          }
          nonAllOffer {
            label
            state
            isNonAllOffer
            hasNonAllOffer
            nonAllPrice {
              price {
                ...CurrencyFields
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      pricing {
        competitionState {
          lowestPrice {
            price {
              ...CurrencyFields
              __typename
            }
            shipping {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          lowestOfferPoints
          buyBoxPrice {
            price {
              ...CurrencyFields
              __typename
            }
            shipping {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          buyBoxPoints
          salesRank {
            rank
            productCategory
            __typename
          }
          __typename
        }
        competitivePricingSummary {
          competitiveBenchmarkPrice {
            price {
              ...CurrencyFields
              __typename
            }
            shipping {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          __typename
        }
        points
        automatedPricing {
          enrollmentStatus
          __typename
        }
        taxData {
          taxRate
          taxExclusivePrice
          taxExclusiveBusinessPrice
          __typename
        }
        __typename
      }
      pointsCentralLink
      __typename
    }
    count`

export const GET_SUPPRESSED_LISTINGS_QUERY = `${GET_SUPPRESSED_LISTINGS_PREFIX}
    __typename
  }
}`

export const GET_LISTING_ISSUES_QUERY = `query getListingIssuesActionsForSku($sku: String!, $contributorToken: String, $marketplaceIds: [String], $clientType: SparcClientType) {
  listingIssuesActions(
    input: {sku: $sku, marketplaceIds: $marketplaceIds, contributorId: $contributorToken, clientType: $clientType}
  ) {
    issues {
      localizedIssueMessage
      type
      tags
      enforcementActions
      issueSource
      parameters {
        key
        value
        __typename
      }
      issuePathForwards {
        type
        attributes {
          v3FlatPath
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}`

interface Currency {
  amount?: string | number | null
  currencyUnit?: string | null
  currencySymbol?: string | null
}

interface KeyValuePair {
  key?: string | null
  value?: string | null
}

interface QuantityPrice {
  quantity?: number | null
  amount?: string | number | null
}

interface PriceAmount {
  price?: Currency | null
}

interface PriceAndShipping {
  price?: Currency | null
  shipping?: Currency | null
}

interface SpecialOffer {
  label?: string | null
  state?: string | null
  isHaulOffer?: boolean | null
  hasHaulOffer?: boolean | null
  isFFOOffer?: boolean | null
  isNonAllOffer?: boolean | null
  hasNonAllOffer?: boolean | null
  haulPrice?: PriceAmount | null
  ffoPrice?: PriceAmount | null
  nonAllPrice?: PriceAmount | null
}

export interface SuppressedOffer {
  fulfillmentChannel?: string | null
  businessProgram?: { value?: string | null; valueLabel?: string | null } | null
  minAllowedPrice?: PriceAmount | null
  maxAllowedPrice?: PriceAmount | null
  price?: PriceAmount | null
  businessPrice?: {
    price?: Currency | null
    percentQuantityPrice?: Array<QuantityPrice | null> | null
    fixedQuantityPrice?: Array<QuantityPrice | null> | null
  } | null
  quantityDiscount?: {
    percentQuantityPrice?: Array<QuantityPrice | null> | null
    fixedQuantityPrice?: Array<QuantityPrice | null> | null
  } | null
  salePrice?: PriceAmount | null
  condition?: { condition?: string | null; subCondition?: string | null } | null
  points?: string | number | null
  automatedPricing?: { enrollmentStatus?: string | null } | null
  maxRetailPrice?: PriceAmount | null
  haulOffer?: SpecialOffer | null
  ffoOffer?: SpecialOffer | null
  nonAllOffer?: SpecialOffer | null
}

export interface ListingIssue {
  localizedIssueMessage?: string | null
  type?: string | null
  tags?: string[] | null
  enforcementActions?: string[] | null
  issueSource?: string | null
  parameters?: Array<{ key?: string | null; value?: string | null } | null> | null
  issuePathForwards?: Array<{
    type?: string | null
    attributes?: Array<{ v3FlatPath?: string | null } | null> | null
  } | null> | null
}

export interface SuppressedListing {
  coreListingFields?: {
    sku?: string | null
    asin?: string | null
    fnSku?: string | null
    fulfillmentChannel?: string | null
  } | null
  listingData?: {
    sku?: string | null
    asin?: string | null
    fnSku?: string | null
    title?: string | null
    titleDifferentiation?: string | null
    productType?: string | null
    bundleStatus?: string | null
    listingType?: string | null
    dateCreated?: string | null
    lastUpdated?: string | null
    parentAsin?: string | null
    parentSku?: string | null
    numberOfChildren?: number | null
    last30DayGms?: string | number | null
    last30DayGv?: string | number | null
    last30DayUnitsSold?: string | number | null
    qualityRecommendationScore?: { grade?: string | null; lastUpdatedDate?: string | null } | null
    externalIds?: Array<{ value?: string | null; type?: string | null } | null> | null
  } | null
  annotations?: {
    favorite?: boolean | null
    tagsAnnotation?: Array<{ value?: string | null } | null> | null
  } | null
  imageUrl?: string | null
  detailPageUrl?: string | null
  skuCentralLink?: string | null
  estimatedShipping?: Currency | null
  isCustomizable?: boolean | null
  isParentListing?: boolean | null
  shippingTemplate?: {
    Legacy?: boolean | null
    TemplateName?: string | null
    TemplateId?: string | null
  } | null
  marketplaceCount?: number | null
  status?: {
    status?: string | null
    statusText?: string | null
    redirectionLink?: string | null
    inlineAction?: string | null
    inlineActionText?: string | null
    highlightedState?: string | null
  } | null
  actions?: Array<{ type?: string | null } | null> | null
  issues?: ListingIssue[] | null
  issuesFetchFailed?: boolean
  availability?: {
    quantity?: number | null
    isQuantityInfinite?: boolean | null
    inventoryAvailability?: string | null
    onHandQuantity?: number | null
    inbound?: number | null
    reservedQuantity?: number | null
    reserved?: {
      fcTransfer?: number | null
      customerOrder?: number | null
      fcProcessing?: number | null
    } | null
    buyableInTransit?: number | null
    pendingCustomerOrdersInTransit?: number | null
    unfulfillable?: number | null
    unfulfillableDetails?: {
      expired?: number | null
      damagedByCarrier?: number | null
      damagedByCustomer?: number | null
      damagedByDistributor?: number | null
      damagedByWarehouse?: number | null
      defective?: number | null
    } | null
    researching?: {
      shortTerm?: number | null
      midTerm?: number | null
      longTerm?: number | null
    } | null
    fbaRecommendation?: {
      type?: string | null
      attributes?: string[] | null
      tags?: string[] | null
      parameters?: Array<KeyValuePair | null> | null
      enforcementActions?: string[] | null
    } | null
    availabilities?: Array<{
      fmid?: string | null
      quantity?: number | null
      fulfillmentChannelName?: string | null
      isFulfilledByAmazon?: boolean | null
    } | null> | null
    aaAvailabilities?: Array<{
      quantity?: number | null
      fulfillmentChannelName?: string | null
      isAggregatedAvailability?: boolean | null
    } | null> | null
    inventoryAlert?: {
      isThresholdReached?: boolean | null
      threshold?: number | null
      alertType?: string | null
    } | null
    recommendation?: {
      daysOfSupply?: number | null
      recommendedInventory?: number | null
    } | null
  } | null
  offers?: Array<SuppressedOffer | null> | null
  pricing?: {
    competitionState?: {
      lowestPrice?: PriceAndShipping | null
      buyBoxPrice?: PriceAndShipping | null
      salesRank?: { rank?: number | null; productCategory?: string | null } | null
    } | null
    competitivePricingSummary?: {
      competitiveBenchmarkPrice?: PriceAndShipping | null
    } | null
    points?: string | number | null
    automatedPricing?: { enrollmentStatus?: string | null } | null
    taxData?: {
      taxRate?: string | number | null
      taxExclusivePrice?: string | number | null
      taxExclusiveBusinessPrice?: string | number | null
    } | null
  } | null
  pointsCentralLink?: string | null
  listingsIncomplete?: boolean
}

interface ListingsPage {
  listings: SuppressedListing[]
  count: number
  /** Rows Amazon returned, including unreadable ones; the next page starts after them. */
  rows: number
}

export interface FetchSuppressedListingsOptions {
  fetch?: typeof globalThis.fetch
  root?: ParentNode
  cookie?: string
  onProgress?: (event: ReportProgressEvent) => void
  log?: Logger
}

function suppressedCell(value: string | number | null | undefined): string {
  if (value == null) return ""
  return String(value)
}

function suppressedQuantity(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function optionalNumber(value: string | number | null | undefined): number | "" {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const amount = Number(value)
    if (Number.isFinite(amount)) return amount
  }
  return ""
}

function suppressedYesNo(value: boolean | null | undefined): string {
  if (value == null) return ""
  return value ? "Yes" : "No"
}

function currencyAmount(price: Currency | null | undefined): number | "" {
  return optionalNumber(price?.amount)
}

function joinParts(parts: Array<string | number | null | undefined>): string {
  return parts
    .map((part) => (part == null ? "" : String(part).trim()))
    .filter(Boolean)
    .join(" | ")
}

function keyValues(pairs: Array<KeyValuePair | null> | null | undefined): string {
  return (pairs ?? [])
    .filter((pair): pair is KeyValuePair => Boolean(pair))
    .map((pair) => `${pair.key ?? ""}=${pair.value ?? ""}`)
    .filter((part) => part !== "=")
    .join(", ")
}

function quantityPrices(entries: Array<QuantityPrice | null> | null | undefined, suffix = ""): string[] {
  return (entries ?? [])
    .filter((entry): entry is QuantityPrice => Boolean(entry))
    .map((entry) => `${suppressedCell(entry.quantity)}${suffix}:${suppressedCell(entry.amount)}`)
    .filter((part) => part !== `${suffix}:` && part !== ":")
}

function formatQuantityDiscount(
  discount: {
    percentQuantityPrice?: Array<QuantityPrice | null> | null
    fixedQuantityPrice?: Array<QuantityPrice | null> | null
  } | null | undefined,
): string {
  if (!discount) return ""
  return [...quantityPrices(discount.percentQuantityPrice, "%"), ...quantityPrices(discount.fixedQuantityPrice)].join(", ")
}

type FbaRecommendation = NonNullable<NonNullable<SuppressedListing["availability"]>["fbaRecommendation"]>

function formatFbaRecommendation(recommendation: FbaRecommendation | null | undefined): string {
  if (!recommendation) return ""
  return joinParts([
    recommendation.type,
    (recommendation.tags ?? []).filter(Boolean).join(", "),
    (recommendation.attributes ?? []).filter(Boolean).join(", "),
    keyValues(recommendation.parameters),
    (recommendation.enforcementActions ?? []).filter(Boolean).join(", "),
  ])
}

function formatAvailabilities(listing: SuppressedListing): string {
  return (listing.availability?.availabilities ?? [])
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => `${suppressedCell(item.fmid)}:${suppressedQuantity(item.quantity)}:${suppressedCell(item.fulfillmentChannelName)}`)
    .filter(Boolean)
    .join(" | ")
}

function formatAaAvailabilities(listing: SuppressedListing): string {
  return (listing.availability?.aaAvailabilities ?? [])
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => joinParts([item.fulfillmentChannelName, suppressedQuantity(item.quantity), item.isAggregatedAvailability ? "aggregated" : ""]))
    .filter(Boolean)
    .join(" | ")
}

function formatInventoryAlert(listing: SuppressedListing): string {
  const alert = listing.availability?.inventoryAlert
  if (!alert) return ""
  return joinParts([
    alert.alertType,
    alert.threshold == null ? "" : `threshold=${alert.threshold}`,
    alert.isThresholdReached == null ? "" : `reached=${suppressedYesNo(alert.isThresholdReached)}`,
  ])
}

function formatSpecialOffer(offer: SpecialOffer | null | undefined, price: Currency | null | undefined): string {
  if (!offer) return ""
  const amount = currencyAmount(price)
  return joinParts([offer.label, offer.state, amount === "" ? "" : amount])
}

function offerRichness(offer: SuppressedOffer): number {
  let score = 0
  const bump = (value: unknown) => {
    if (value != null && value !== "") score += 1
  }
  bump(offer.price?.price?.amount)
  bump(offer.businessPrice)
  bump(offer.quantityDiscount)
  bump(offer.salePrice?.price?.amount)
  bump(offer.minAllowedPrice?.price?.amount)
  bump(offer.maxAllowedPrice?.price?.amount)
  bump(offer.automatedPricing)
  bump(offer.maxRetailPrice?.price?.amount)
  bump(offer.haulOffer)
  bump(offer.ffoOffer)
  bump(offer.nonAllOffer)
  bump(offer.points)
  bump(offer.condition?.condition)
  return score
}

export function primaryOffer(listing: SuppressedListing): SuppressedOffer | undefined {
  const offers = (listing.offers ?? []).filter((offer): offer is SuppressedOffer => Boolean(offer))
  if (offers.length === 0) return undefined
  return offers.reduce((best, offer) => (offerRichness(offer) > offerRichness(best) ? offer : best))
}

function asSuppressedListing(value: unknown): SuppressedListing | undefined {
  if (!value || typeof value !== "object") return undefined
  return value as SuppressedListing
}

export function parseSuppressedListingsPage(payload: unknown): ListingsPage {
  const messages = graphqlMessages(payload)
  const data = payload && typeof payload === "object" && "data" in payload ? (payload as { data?: unknown }).data : undefined
  const listingsV2 =
    data && typeof data === "object" && "listingsV2" in data
      ? (data as { listingsV2?: unknown }).listingsV2
      : undefined

  if (!listingsV2 || typeof listingsV2 !== "object") {
    if (messages.length) throw new Error(messages.join(" "))
    throw new Error("Couldn’t load search-suppressed inventory.")
  }

  const record = listingsV2 as { listings?: unknown; count?: unknown }
  const rows = Array.isArray(record.listings) ? record.listings : []
  const listings = rows.map(asSuppressedListing).filter((listing): listing is SuppressedListing => listing !== undefined)
  const count = typeof record.count === "number" && Number.isFinite(record.count) ? record.count : listings.length
  return { listings, count, rows: rows.length }
}

export function suppressedSheetRow(listing: SuppressedListing): Array<string | number> {
  const offer = primaryOffer(listing)
  const details = listing.availability?.unfulfillableDetails
  const competition = listing.pricing?.competitionState
  const benchmark = listing.pricing?.competitivePricingSummary?.competitiveBenchmarkPrice
  const price = currencyAmount(offer?.price?.price)
  return [
    suppressedCell(listing.coreListingFields?.sku ?? listing.listingData?.sku),
    suppressedCell(listing.coreListingFields?.asin ?? listing.listingData?.asin),
    suppressedCell(listing.coreListingFields?.fnSku ?? listing.listingData?.fnSku),
    suppressedCell(listing.listingData?.title),
    suppressedCell(listing.listingData?.titleDifferentiation),
    suppressedCell(listing.imageUrl),
    suppressedCell(listing.detailPageUrl),
    suppressedCell(listing.skuCentralLink),
    formatListingStatus(listing.status?.status),
    suppressedCell(listing.status?.statusText),
    suppressedCell(listing.status?.highlightedState),
    suppressedCell(listing.status?.inlineAction),
    suppressedCell(listing.status?.inlineActionText),
    suppressedCell(listing.status?.redirectionLink),
    ...suppressedIssueCells(listing),
    suppressedCell(listing.listingData?.productType),
    suppressedCell(listing.listingData?.listingType),
    suppressedCell(listing.listingData?.bundleStatus),
    suppressedCell(listing.coreListingFields?.fulfillmentChannel ?? offer?.fulfillmentChannel),
    suppressedCell(offer?.condition?.condition),
    suppressedCell(offer?.condition?.subCondition),
    suppressedCell(listing.listingData?.parentAsin),
    suppressedCell(listing.listingData?.parentSku),
    suppressedQuantity(listing.listingData?.numberOfChildren),
    suppressedYesNo(listing.isParentListing),
    suppressedYesNo(listing.isCustomizable),
    suppressedQuantity(listing.marketplaceCount),
    (listing.listingData?.externalIds ?? [])
      .filter((id): id is NonNullable<typeof id> => Boolean(id))
      .map((id) => `${suppressedCell(id.type)}:${suppressedCell(id.value)}`)
      .filter((part) => part !== ":")
      .join(", "),
    suppressedYesNo(listing.annotations?.favorite),
    (listing.annotations?.tagsAnnotation ?? [])
      .map((tag) => tag?.value)
      .filter((value): value is string => Boolean(value))
      .join(", "),
    suppressedCell(listing.shippingTemplate?.TemplateName),
    suppressedCell(listing.shippingTemplate?.TemplateId),
    suppressedYesNo(listing.shippingTemplate?.Legacy),
    suppressedCell(listing.listingData?.dateCreated),
    suppressedCell(listing.listingData?.lastUpdated),
    optionalNumber(listing.listingData?.last30DayGms),
    optionalNumber(listing.listingData?.last30DayGv),
    optionalNumber(listing.listingData?.last30DayUnitsSold),
    suppressedCell(listing.listingData?.qualityRecommendationScore?.grade),
    suppressedCell(listing.listingData?.qualityRecommendationScore?.lastUpdatedDate),
    suppressedQuantity(listing.availability?.quantity),
    suppressedYesNo(listing.availability?.isQuantityInfinite),
    suppressedCell(listing.availability?.inventoryAvailability),
    suppressedQuantity(listing.availability?.onHandQuantity),
    suppressedQuantity(listing.availability?.inbound),
    suppressedQuantity(listing.availability?.reservedQuantity),
    suppressedQuantity(listing.availability?.reserved?.fcTransfer),
    suppressedQuantity(listing.availability?.reserved?.customerOrder),
    suppressedQuantity(listing.availability?.reserved?.fcProcessing),
    suppressedQuantity(listing.availability?.buyableInTransit),
    suppressedQuantity(listing.availability?.pendingCustomerOrdersInTransit),
    suppressedQuantity(listing.availability?.unfulfillable),
    suppressedQuantity(details?.damagedByCarrier),
    suppressedQuantity(details?.damagedByCustomer),
    suppressedQuantity(details?.defective),
    suppressedQuantity(details?.expired),
    suppressedQuantity(details?.damagedByWarehouse),
    suppressedQuantity(details?.damagedByDistributor),
    suppressedQuantity(listing.availability?.researching?.shortTerm),
    suppressedQuantity(listing.availability?.researching?.midTerm),
    suppressedQuantity(listing.availability?.researching?.longTerm),
    formatFbaRecommendation(listing.availability?.fbaRecommendation),
    formatAvailabilities(listing),
    formatAaAvailabilities(listing),
    formatInventoryAlert(listing),
    optionalNumber(listing.availability?.recommendation?.daysOfSupply),
    optionalNumber(listing.availability?.recommendation?.recommendedInventory),
    price,
    suppressedCell(offer?.price?.price?.currencyUnit),
    currencyAmount(offer?.salePrice?.price),
    currencyAmount(offer?.minAllowedPrice?.price),
    currencyAmount(offer?.maxAllowedPrice?.price),
    currencyAmount(offer?.businessPrice?.price),
    formatQuantityDiscount(offer?.quantityDiscount ?? offer?.businessPrice),
    currencyAmount(offer?.maxRetailPrice?.price),
    currencyAmount(listing.estimatedShipping),
    suppressedCell(offer?.points ?? listing.pricing?.points),
    suppressedCell(offer?.automatedPricing?.enrollmentStatus ?? listing.pricing?.automatedPricing?.enrollmentStatus),
    optionalNumber(listing.pricing?.taxData?.taxRate),
    optionalNumber(listing.pricing?.taxData?.taxExclusivePrice),
    optionalNumber(listing.pricing?.taxData?.taxExclusiveBusinessPrice),
    currencyAmount(competition?.lowestPrice?.price),
    currencyAmount(competition?.lowestPrice?.shipping),
    currencyAmount(competition?.buyBoxPrice?.price),
    currencyAmount(competition?.buyBoxPrice?.shipping),
    optionalNumber(competition?.salesRank?.rank),
    suppressedCell(competition?.salesRank?.productCategory),
    currencyAmount(benchmark?.price),
    currencyAmount(benchmark?.shipping),
    suppressedCell(offer?.businessProgram?.valueLabel ?? offer?.businessProgram?.value),
    formatSpecialOffer(offer?.haulOffer, offer?.haulOffer?.haulPrice?.price),
    formatSpecialOffer(offer?.ffoOffer, offer?.ffoOffer?.ffoPrice?.price),
    formatSpecialOffer(offer?.nonAllOffer, offer?.nonAllOffer?.nonAllPrice?.price),
    (listing.actions ?? [])
      .map((action) => action?.type)
      .filter((type): type is string => Boolean(type))
      .join(", "),
    suppressedCell(listing.pointsCentralLink),
  ]
}

function listingSku(listing: SuppressedListing): string | undefined {
  const sku = listing.coreListingFields?.sku?.trim() || listing.listingData?.sku?.trim()
  return sku || undefined
}

function issueParameter(issue: ListingIssue, key: string): string {
  for (const parameter of issue.parameters ?? []) {
    if (parameter?.key === key && parameter.value) return parameter.value
  }
  return ""
}

function issueAttribute(issue: ListingIssue): string {
  const fromParams = issueParameter(issue, "v3_flat_attribute_name") || issueParameter(issue, "attribute_name")
  if (fromParams) return fromParams.replace(/^\[|\]$/g, "")
  for (const forward of issue.issuePathForwards ?? []) {
    for (const attribute of forward?.attributes ?? []) {
      if (attribute?.v3FlatPath) return attribute.v3FlatPath
    }
  }
  return ""
}

export function formatSuppressedIssues(issues: readonly ListingIssue[] | null | undefined): {
  message: string
  type: string
  attribute: string
  enforcement: string
  source: string
  tags: string
} {
  const rows = (issues ?? []).filter((issue): issue is ListingIssue => Boolean(issue))
  const join = (values: Array<string | null | undefined>) => values.map((value) => value?.trim() ?? "").filter(Boolean).join(" || ")
  const tags = new Set<string>()
  for (const issue of rows) {
    for (const tag of issue.tags ?? []) {
      if (tag) tags.add(tag)
    }
  }
  return {
    message: join(rows.map((issue) => issue.localizedIssueMessage)),
    type: join(rows.map((issue) => issue.type)),
    attribute: join(rows.map(issueAttribute)),
    enforcement: join(rows.map((issue) => (issue.enforcementActions ?? []).filter(Boolean).join(", "))),
    source: join(rows.map((issue) => issue.issueSource)),
    tags: [...tags].join(", "),
  }
}

function suppressedIssueCells(listing: SuppressedListing): string[] {
  if (listing.issuesFetchFailed) {
    return [SUPPRESSED_ISSUE_UNAVAILABLE, "", "", "", "", ""]
  }
  const formatted = formatSuppressedIssues(listing.issues)
  return [formatted.message, formatted.type, formatted.attribute, formatted.enforcement, formatted.source, formatted.tags]
}

export function parseListingIssues(payload: unknown): ListingIssue[] {
  const messages = graphqlMessages(payload)
  const data = payload && typeof payload === "object" && "data" in payload ? (payload as { data?: unknown }).data : undefined
  const listingIssuesActions =
    data && typeof data === "object" && "listingIssuesActions" in data
      ? (data as { listingIssuesActions?: unknown }).listingIssuesActions
      : undefined

  if (!listingIssuesActions || typeof listingIssuesActions !== "object") {
    if (messages.length) throw new Error(messages.join(" "))
    throw new Error("Couldn’t load listing suppression reasons.")
  }

  const issues = (listingIssuesActions as { issues?: unknown }).issues
  if (!Array.isArray(issues)) return []
  return issues.filter((issue): issue is ListingIssue => Boolean(issue && typeof issue === "object"))
}

export function hasNonZeroQuantity(listing: SuppressedListing): boolean {
  if (listing.availability?.isQuantityInfinite) return true
  const available = listing.availability?.quantity
  return typeof available === "number" && Number.isFinite(available) && available !== 0
}

export function inStockSuppressedListings(listings: readonly SuppressedListing[]): SuppressedListing[] {
  return listings.filter(hasNonZeroQuantity)
}

function suppressedSheetNotes(listings: readonly SuppressedListing[]): Array<Array<string | number>> {
  const notes: Array<Array<string | number>> = []
  if (listings.some((listing) => listing.listingsIncomplete)) notes.push([SUPPRESSED_LISTINGS_INCOMPLETE_NOTE])
  if (listings.some((listing) => listing.issuesFetchFailed)) notes.push([SUPPRESSED_ISSUES_INCOMPLETE_NOTE])
  if (notes.length) notes.push([])
  return notes
}

export function suppressedSheetRows(listings: readonly SuppressedListing[]): Array<Array<string | number>> {
  const rows = inStockSuppressedListings(listings)
  return [...suppressedSheetNotes(listings), [...SUPPRESSED_SHEET_HEADERS], ...rows.map(suppressedSheetRow)]
}

function suppressedListingsVariables(from: number, size: number): Record<string, unknown> {
  return {
    pagination: { from, size },
    sortRequest: { key: "QUANTITY_AVAILABLE", order: "DESCENDING" },
    multiSelectFilters: [
      { key: "LISTING_STATUS", values: ["SearchSuppressed"] },
      { key: "FULFILLMENT", values: ["AllChannels"] },
      { key: "CONDITION", values: [] },
    ],
  }
}

async function postSuppressedListingsPage(
  fetchImpl: typeof globalThis.fetch,
  token: string,
  from: number,
  size: number,
): Promise<ListingsPage> {
  const response = await fetchImpl(SUPPRESSED_GQL_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      accept: "application/graphql-response+json, application/json",
      "content-type": "application/json",
      "anti-csrftoken-a2z": token,
    },
    body: JSON.stringify({
      operationName: "getListingsV2",
      variables: suppressedListingsVariables(from, size),
      query: GET_SUPPRESSED_LISTINGS_QUERY,
    }),
  })

  if (!response.ok) throw new Error(`Couldn’t load search-suppressed inventory (${response.status}).`)

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("Couldn’t load search-suppressed inventory.")
  }

  return parseSuppressedListingsPage(payload)
}

async function postListingIssues(
  fetchImpl: typeof globalThis.fetch,
  token: string,
  sku: string,
): Promise<ListingIssue[]> {
  const response = await fetchImpl(SUPPRESSED_GQL_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      accept: "application/graphql-response+json, application/json",
      "content-type": "application/json",
      "anti-csrftoken-a2z": token,
    },
    body: JSON.stringify({
      operationName: "getListingIssuesActionsForSku",
      variables: { sku, contributorToken: "" },
      query: GET_LISTING_ISSUES_QUERY,
    }),
  })

  if (!response.ok) throw new Error(`Couldn’t load listing suppression reasons (${response.status}).`)

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("Couldn’t load listing suppression reasons.")
  }

  return parseListingIssues(payload)
}

/** Loads each SKU's suppression reasons, keeping SUPPRESSED_ISSUES_CONCURRENCY requests in flight. */
async function fetchListingIssues(
  fetchImpl: typeof globalThis.fetch,
  token: string,
  listings: readonly SuppressedListing[],
  onProgress?: (event: ReportProgressEvent) => void,
  log?: Logger,
): Promise<SuppressedListing[]> {
  if (listings.length === 0) return []
  const total = listings.length
  onProgress?.({ source: "suppressed", status: "active", loaded: 0, total, phase: "issues" })
  let processed = 0
  let failed = 0
  const withIssues = await mapWithConcurrency(listings, SUPPRESSED_ISSUES_CONCURRENCY, async (listing) => {
    const sku = listingSku(listing)
    let result: SuppressedListing
    if (!sku) {
      result = { ...listing, issues: [] }
    } else {
      try {
        result = { ...listing, issues: await postListingIssues(fetchImpl, token, sku) }
      } catch (error) {
        failed += 1
        if (failed === 1) log?.warn("suppressed.issuesFailed", { error: describeError(error) })
        result = { ...listing, issues: [], issuesFetchFailed: true }
      }
    }
    processed += 1
    onProgress?.({ source: "suppressed", status: "active", loaded: processed, total, phase: "issues" })
    return result
  })
  if (failed > 0) log?.warn("suppressed.issuesIncomplete", { failed, total })
  return withIssues
}

export async function fetchSuppressedListings(
  options: FetchSuppressedListingsOptions = {},
): Promise<SuppressedListing[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const root = options.root ?? document
  const cookie = options.cookie ?? (typeof document !== "undefined" ? document.cookie : "")
  const onProgress = options.onProgress
  const log = options.log
  let token = readAntiCsrfToken(root, cookie)
  if (!token) {
    log?.info("suppressed.tokenFromInventoryPage")
    token = await fetchAntiCsrfTokenFromInventory(fetchImpl)
  }
  if (!token) throw new Error("Couldn’t read the Seller Central security token.")

  onProgress?.({ source: "suppressed", status: "active", loaded: 0, phase: "listings" })

  const listings: SuppressedListing[] = []
  let offset = 0
  let reportedCount = 0
  let listingsIncomplete = false
  let stoppedAtZeroAvailable = false

  for (let page = 0; page < SUPPRESSED_MAX_PAGES; page += 1) {
    const size = page === 0 ? SUPPRESSED_FIRST_PAGE_SIZE : SUPPRESSED_PAGE_SIZE
    const pageDone = log?.time("suppressed.page", { page, from: offset, size })
    let result: ListingsPage
    try {
      result = await postSuppressedListingsPage(fetchImpl, token, offset, size)
    } catch (error) {
      if (listings.length > 0) {
        log?.warn("suppressed.listingsStopped", { page, loaded: listings.length, error: describeError(error) })
        listingsIncomplete = true
        break
      }
      throw error
    }

    // Available quantity is descending, so the first out-of-stock row ends the scan.
    const cutoff = result.listings.findIndex((listing) => !hasNonZeroQuantity(listing))
    const inStock = cutoff === -1 ? result.listings : result.listings.slice(0, cutoff)
    listings.push(...inStock)
    stoppedAtZeroAvailable = cutoff !== -1
    offset += result.rows
    reportedCount = result.count
    pageDone?.({ rows: result.rows, inStock: inStock.length, reported: result.count })
    onProgress?.({
      source: "suppressed",
      status: "active",
      loaded: listings.length,
      total: result.count,
      phase: "listings",
    })
    if (stoppedAtZeroAvailable || result.rows === 0 || offset >= result.count) break
  }

  if (!stoppedAtZeroAvailable && reportedCount > offset) {
    log?.warn("suppressed.listingsIncomplete", { scanned: offset, reported: reportedCount })
    listingsIncomplete = true
  }

  const tagged = listingsIncomplete
    ? listings.map((listing) => ({ ...listing, listingsIncomplete: true }))
    : listings
  const inStock = inStockSuppressedListings(tagged)
  const merged = await fetchListingIssues(fetchImpl, token, inStock, onProgress, log)
  onProgress?.({
    source: "suppressed",
    status: "complete",
    loaded: merged.length,
    total: merged.length,
    phase: merged.length > 0 ? "issues" : "listings",
  })
  return merged
}
