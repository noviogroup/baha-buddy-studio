#!/usr/bin/env node

/**
 * Read-only adjudication calculations for high-risk missing signature places.
 * It combines explicit primary-source context with already captured official
 * tourism-map records. Inferences rank evidence for review but accept nothing.
 */

import fs from 'node:fs'

const mapRawPath = process.argv[2] || '/private/tmp/baha-buddy-signature-place-official-map-crosswalk-raw.json'
const outputBase = process.argv[3] || '/private/tmp/baha-buddy-signature-place-source-adjudication'

if (!fs.existsSync(mapRawPath)) throw new Error(`Missing input: ${mapRawPath}`)
const rawByIsland = JSON.parse(fs.readFileSync(mapRawPath, 'utf8'))

function numeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function recordPoint(record) {
  const latitude = numeric(record.latitude)
  const longitude = numeric(record.longitude)
  if (latitude == null || longitude == null) throw new Error(`Record ${record.id ?? record.pin_id} has no numeric point`)
  return {latitude, longitude}
}

function metresBetween(left, right) {
  const toRadians = (value) => value * Math.PI / 180
  const latitudeDelta = toRadians(right.latitude - left.latitude)
  const longitudeDelta = toRadians(right.longitude - left.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(left.latitude)) * Math.cos(toRadians(right.latitude)) *
    Math.sin(longitudeDelta / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findRecord(islandSlug, recordId, recordType) {
  const records = rawByIsland[islandSlug] || []
  const field = recordType === 'tourism_business' ? 'id' : 'pin_id'
  const record = records.find((candidate) => String(candidate[field]) === String(recordId))
  if (!record) throw new Error(`Missing ${islandSlug} ${recordType} record ${recordId}`)
  const point = recordPoint(record)
  return {
    mapRecordId: recordId,
    mapRecordType: recordType,
    name: String(record.business_name || '').trim(),
    latitude: point.latitude,
    longitude: point.longitude,
    sourceUpdatedAt: record.updated_at || null,
    sourceUrl: recordType === 'tourism_business' ? `https://www.bahamas.com/map#b=${recordId}` : 'https://www.bahamas.com/map',
  }
}

function distance(left, right) {
  return Math.round(metresBetween(left, right))
}

const fountainBusiness = findRecord('bimini', 4401, 'tourism_business')
const fountainPin = findRecord('bimini', 11341, 'tourism_map_pin')
const southBiminiAirport = findRecord('bimini', 11560, 'tourism_map_pin')
const queenBusiness = findRecord('nassau-paradise-island', 4424, 'tourism_business')
const queenPin = findRecord('nassau-paradise-island', 11377, 'tourism_map_pin')
const fortBusiness = findRecord('nassau-paradise-island', 1358, 'tourism_business')
const fortPin = findRecord('nassau-paradise-island', 11378, 'tourism_map_pin')
const samanaCay = findRecord('acklins-crooked-island', 11335, 'tourism_map_pin')
const catholicChurch = findRecord('long-island', 4365, 'tourism_business')

const rows = [
  {
    islandSlug: 'bimini',
    officialName: 'Fountain of Youth',
    adjudicationStatus: 'contextually_preferred_point_conflict_unresolved',
    sourceContext: {
      url: 'https://www.bahamas.com/natural-wonders/fountain-of-youth',
      assertion: 'The national tourism authority says the locally named well is near the road leading to the airport.',
    },
    candidates: [
      {...fountainBusiness, distanceToOfficialAirportMetres: distance(fountainBusiness, southBiminiAirport), evidenceRank: 1},
      {...fountainPin, distanceToOfficialAirportMetres: distance(fountainPin, southBiminiAirport), evidenceRank: 2},
    ],
    anchors: [southBiminiAirport],
    inference: `The business-record point is ${distance(fountainBusiness, southBiminiAirport)} metres from the official South Bimini Airport pin; the undated map pin is ${distance(fountainPin, southBiminiAirport)} metres away. The business point is the stronger candidate for editorial review, but the conflict remains pending and neither point is accepted.`,
  },
  {
    islandSlug: 'nassau-paradise-island',
    officialName: "Queen's Staircase",
    adjudicationStatus: 'historic_complex_multi_point_conflict_unresolved',
    sourceContext: {
      url: 'https://www.bahamas.com/plan-your-trip/things-to-do/the-queens-staircase',
      assertion: 'The official attraction page places the staircase on Elizabeth Avenue South and describes it as the direct route from Fort Fincastle to Nassau.',
    },
    candidates: [
      {...queenBusiness, distanceToFortMapPinMetres: distance(queenBusiness, fortPin)},
      {...queenPin, distanceToFortMapPinMetres: distance(queenPin, fortPin)},
    ],
    anchors: [fortPin],
    inference: `Both staircase points can describe different parts of a linear feature or historic complex. They are ${distance(queenBusiness, queenPin)} metres apart; the map pin is ${distance(queenPin, fortPin)} metres from the Fort Fincastle map pin and the business point is ${distance(queenBusiness, fortPin)} metres away. No canonical entrance or feature point is selected.`,
  },
  {
    islandSlug: 'nassau-paradise-island',
    officialName: 'Fort Fincastle',
    adjudicationStatus: 'map_pin_contextually_preferred_conflict_unresolved',
    sourceContext: {
      url: 'https://www.bahamas.com/natural-wonders/fort-fincastle',
      assertion: 'The official attraction page places the fort atop Bennet’s Hill and gives current visitor-tour context.',
    },
    candidates: [
      {
        ...fortBusiness,
        distanceToQueenBusinessMetres: distance(fortBusiness, queenBusiness),
        distanceToQueenMapPinMetres: distance(fortBusiness, queenPin),
        evidenceRank: 2,
      },
      {
        ...fortPin,
        distanceToQueenBusinessMetres: distance(fortPin, queenBusiness),
        distanceToQueenMapPinMetres: distance(fortPin, queenPin),
        evidenceRank: 1,
      },
    ],
    anchors: [queenBusiness, queenPin],
    inference: `The Fort map pin is ${distance(fortPin, queenPin)} metres from the Queen's Staircase map pin, consistent with the official historic-complex relationship. The Fort business point is ${distance(fortBusiness, queenPin)} metres from that staircase pin and remains a strong outlier. The Fort map pin is preferred for further review, not accepted.`,
  },
  {
    islandSlug: 'acklins-crooked-island',
    officialName: 'Ancient Lucayan Sites',
    adjudicationStatus: 'distributed_identity_with_one_component_area_marker',
    sourceContext: {
      url: 'https://www.bahamas.com/plan-your-trip/things-to-do/lucayan-indian-sites',
      assertion: 'The official page identifies a major settlement at Pompey Bay Beach and ten sites on Samana Cay; its displayed destination label is inconsistent with its Acklins content.',
    },
    candidates: [{...samanaCay, relationship: 'component_area_marker'}],
    anchors: [],
    inference: 'The Samana Cay map pin locates a component island, not any of the ten archaeological sites. Pompey Bay Beach and every individual site still need protected-site authority and exact-location evidence.',
  },
  {
    islandSlug: 'long-island',
    officialName: 'Twin Churches',
    adjudicationStatus: 'two_site_identity_with_one_component_point',
    sourceContext: {
      url: 'https://www.bahamas.com/place/bahamas/long-island/clarence-town',
      assertion: "The official Long Island page identifies St. Paul's Church and St. Peter & St. Paul's Church as the two Clarence Town churches.",
    },
    candidates: [{...catholicChurch, relationship: 'component_site'}],
    anchors: [],
    inference: "The official map supplies a point for St. Peter & St. Paul's Catholic Church only. St. Paul's Anglican Church still needs an exact responsible-source point, so the plural identity cannot be represented by the Catholic church coordinate.",
  },
  {
    islandSlug: 'bimini',
    officialName: 'Dolphin House Museum',
    adjudicationStatus: 'responsible_operator_identity_without_point',
    sourceContext: {
      url: 'https://www.historyofbimini.com/',
      assertion: 'The current owner/operator site identifies Sir Ashley Saunders as founder and CEO and publishes a Bahamas contact number, but no exact point or current visitor schedule.',
    },
    candidates: [],
    anchors: [],
    inference: 'Operation identity is stronger, but the exact entrance, address, hours, admission, reservations, accessibility, and current tour conditions remain unresolved.',
  },
  {
    islandSlug: 'cat-island',
    officialName: "Sir Sidney Poitier's Boyhood Home",
    adjudicationStatus: 'official_relative_identity_without_site_point',
    sourceContext: {
      url: 'https://www.bahamas.com/islands/cat-island',
      assertion: "The official island page says Poitier grew up just outside Arthur's Town; it does not identify a preserved house, public attraction, entrance, or point.",
    },
    candidates: [],
    anchors: [],
    inference: 'Treat this as a biographical/relative-location identity until a responsible heritage source establishes whether a specific surviving site is public and appropriate to locate.',
  },
  {
    islandSlug: 'ragged-island',
    officialName: 'Pigeon Cay',
    adjudicationStatus: 'official_relative_identity_without_point',
    sourceContext: {
      url: 'https://www.bahamas.com/islands/ragged-island',
      assertion: 'The official island page says Pigeon Cay is visible off Ragged Island near Gun Point and identifies a memorial cross.',
    },
    candidates: [],
    anchors: [],
    inference: 'The relative description supports identity and context, not a cay centroid, landing, route, ownership, permission, safe access, or memorial point.',
  },
]

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope: 'Three official-map point conflicts plus five high-value no-point or multi-site signature identities.',
    sourceRule: 'Primary national-tourism or responsible-operator context is combined with exact, already captured tourism-map record IDs. Geographic comparisons are transparent Haversine distances rounded to metres.',
    inferenceRule: 'Contextual proximity can rank candidates but cannot approve a coordinate. Linear features, historic complexes, communities, cays, and distributed archaeological identities are not forced into one POI point.',
    guardrail: 'Read-only calculations. No Supabase or Sanity mutation, coordinate acceptance, activation, delivery channel, operation guarantee, or traveler-safety conclusion.',
  },
  rows,
}

fs.writeFileSync(`${outputBase}.json`, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(
  `${outputBase}.tsv`,
  [
    ['island', 'official_name', 'adjudication_status', 'map_record_id', 'map_record_type', 'map_name', 'latitude', 'longitude', 'evidence_rank'].join('\t'),
    ...rows.flatMap((row) => row.candidates.length ? row.candidates.map((candidate) => [
      row.islandSlug,
      row.officialName,
      row.adjudicationStatus,
      candidate.mapRecordId,
      candidate.mapRecordType,
      candidate.name,
      candidate.latitude,
      candidate.longitude,
      candidate.evidenceRank || '',
    ].join('\t')) : [[row.islandSlug, row.officialName, row.adjudicationStatus, '', '', '', '', '', ''].join('\t')]),
  ].join('\n') + '\n',
)

console.log(JSON.stringify({rows: rows.length, report: `${outputBase}.json`, statuses: Object.fromEntries(rows.map((row) => [row.officialName, row.adjudicationStatus]))}, null, 2))
