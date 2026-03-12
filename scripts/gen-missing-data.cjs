const fs = require('fs')
const path = require('path')

const instrumentsPath = path.join(__dirname, '../src/data/instruments.json')
const dimensionsPath = path.join(__dirname, '../src/data/dimensions.json')

const instruments = JSON.parse(fs.readFileSync(instrumentsPath, 'utf8'))
const dimensions = JSON.parse(fs.readFileSync(dimensionsPath, 'utf8'))

function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(42)

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}

function randBetween(min, max) {
  return min + rand() * (max - min)
}

function randInt(min, max) {
  return Math.floor(randBetween(min, max + 1))
}

function round(val, decimals) {
  const f = Math.pow(10, decimals)
  return Math.round(val * f) / f
}

function randomDate(startYear, endYear) {
  const y = randInt(startYear, endYear)
  const m = randInt(1, 12)
  const d = randInt(1, 28)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const listGenerators = {
  alm_account_num: () => {
    const vals = []
    for (let i = 1; i <= 60; i++) vals.push(`ALM-${String(i).padStart(4, '0')}`)
    return vals
  },
  acquisition_id: () => ['ACQ-2020', 'ACQ-2021', 'ACQ-2022', 'ACQ-2023', 'ACQ-2024', 'ACQ-2025', 'Organic', 'Merger-2019', 'Merger-2022', 'Portfolio-Purchase'],
  branch_code: () => ['Downtown', 'Westside', 'Northgate', 'Eastview', 'Southpark', 'Midtown', 'Lakeshore', 'Hillcrest'],
  call_code_name: () => ['Callable', 'Non-Callable', 'Make-Whole', 'Defeasance', 'Yield-Maintenance', 'Lockout'],
  collateral_type_name: () => ['1-4 Family Residential', 'Multifamily', 'Commercial Real Estate', 'Vehicle', 'Equipment', 'Unsecured', 'Cash/Securities', 'Other'],
  ccf: () => ['0%', '20%', '50%', '75%', '100%'],
  gl_account_num: () => ['1410-Comm RE Loans', '1420-Resi Mortgages', '1430-Consumer Loans', '1440-Auto Loans', '1450-Construction', '1460-Ag Loans', '1470-Credit Cards', '1480-Other'],
  gov_guaranteed_rate: () => ['0%', '50%', '80%', '90%', '100%'],
  gov_guaranteed_amount: () => pick,
  type_code: () => ['OO', 'NOO', 'INV', 'VAC'],
  type_value: () => ['Owner-Occupied', 'Non-Owner-Occupied', 'Investment', 'Vacant'],
  occupancy_rate: () => pick,
  orig_risk_rating_code_sid: () => ['Pass', 'Watch', 'Special Mention', 'Substandard', 'Doubtful'],
  risk_rating_code: () => ['1-Minimal', '2-Low', '3-Moderate', '4-Acceptable', '5-Watch', '6-Special Mention', '7-Substandard', '8-Doubtful', '9-Loss'],
  specific_provision: () => pick,
  sub_product_name: () => ['30-Year Fixed', '15-Year Fixed', '5/1 ARM', '7/1 ARM', 'HELOC', 'Construction-Perm', 'Auto New', 'Auto Used', 'CRE Term', 'CRE Line'],
  is_balance_sheet: () => ['Y', 'N'],
  new_inst_flag: () => ['Y', 'N'],
  pnts_pch_flag: () => ['Y', 'N'],
  renewal_flag: () => ['Y', 'N'],
  individually_analyzed_system_flag: () => ['Y', 'N'],
}

const rangeGenerators = {
  curr_pmt_prin: (inst) => round(randBetween(100, 15000), 2),
  fico_score: () => randInt(580, 850),
  first_periodic_cap: () => round(randBetween(1, 5), 3),
  lifetime_cap: () => round(randBetween(5, 18), 3),
  lifetime_floor: () => round(randBetween(0, 4), 3),
  original_coupon: () => round(randBetween(0.015, 0.085), 6),
  orig_debt_to_income: () => round(randBetween(0.15, 0.55), 4),
  original_face: (inst) => round(inst.curr_book * randBetween(1.0, 1.3), 2),
  periodic_cap: () => round(randBetween(1, 3), 3),
  pnts_pch_amt: () => round(randBetween(0, 5000), 2),
  pnts_pch_rt: () => round(randBetween(0, 0.03), 4),
  principal_payment_amount: (inst) => round(randBetween(50, 10000), 2),
  sato: () => round(randBetween(-0.02, 0.03), 4),
  observation_period: () => randInt(1, 120),
  amort_date: () => randomDate(2020, 2028),
  first_reset_date: () => randomDate(2024, 2030),
  maturity_date: () => randomDate(2026, 2056),
  next_interest_date: () => randomDate(2026, 2027),
  next_principal_date: () => randomDate(2026, 2027),
  next_reset_date: () => randomDate(2026, 2030),
}

const emptyListGenerators = {
  acl: () => ['$0', '$1-$1K', '$1K-$5K', '$5K-$25K', '$25K-$100K', '$100K+'],
  collateral_zipcode: () => ['10001', '10002', '20001', '30301', '33101', '60601', '77001', '85001', '90001', '94101', '98101', '02101'],
  lgd: () => ['0-10%', '10-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
  msa_code: () => ['31080', '35620', '16980', '33460', '12060', '26420', '47900', '37980', '19100', '41860'],
  msa_name: () => ['Los Angeles', 'New York', 'Chicago', 'Houston', 'Atlanta', 'Dallas', 'Washington DC', 'Philadelphia', 'Miami', 'San Francisco'],
  msa_type: () => ['Metro', 'Micro', 'Rural'],
}

const instColumns = new Set(Object.keys(instruments[0]))

function getSegmentableDimsWithoutData() {
  return dimensions.filter(d => {
    if (!d.segmentable) return false
    const col = d.dimensionColumn
    const hasData = instColumns.has(col) &&
      instruments.some(i => i[col] !== null && i[col] !== undefined)
    return !hasData
  })
}

const missingDims = getSegmentableDimsWithoutData()
console.log(`Found ${missingDims.length} segmentable dimensions without instrument data.\n`)

for (const dim of missingDims) {
  const col = dim.dimensionColumn
  
  if (dim.dimensionType === 'range' || rangeGenerators[col]) {
    const gen = rangeGenerators[col]
    if (!gen) {
      console.log(`SKIP (no range generator): ${dim.dimensionName} | ${col}`)
      continue
    }
    for (const inst of instruments) {
      inst[col] = gen(inst)
    }
    console.log(`Generated range data: ${dim.dimensionName} | ${col}`)
    continue
  }

  let values
  if (listGenerators[col]) {
    const result = listGenerators[col]()
    if (typeof result === 'function') {
      values = dim.values || ['Unknown']
    } else {
      values = result
    }
  } else if (emptyListGenerators[col]) {
    values = emptyListGenerators[col]()
  } else if (dim.values && dim.values.length > 0) {
    values = dim.values
  } else {
    console.log(`SKIP (no values/generator): ${dim.dimensionName} | ${col}`)
    continue
  }

  for (const inst of instruments) {
    inst[col] = pick(values)
  }

  dim.values = [...new Set(values)].sort()
  dim.valueCount = dim.values.length

  console.log(`Generated list data: ${dim.dimensionName} | ${col} | ${values.length} values`)
}

const specialNumericDims = ['gov_guaranteed_rate', 'gov_guaranteed_amount', 'occupancy_rate', 'specific_provision']
for (const dim of missingDims) {
  const col = dim.dimensionColumn
  if (specialNumericDims.includes(col)) {
    let gen
    if (col === 'gov_guaranteed_rate') gen = () => round(randBetween(0, 1), 4)
    else if (col === 'gov_guaranteed_amount') gen = (inst) => round(inst.curr_book * randBetween(0, 0.9), 2)
    else if (col === 'occupancy_rate') gen = () => round(randBetween(0.5, 1.0), 2)
    else if (col === 'specific_provision') gen = () => round(randBetween(0, 50000), 2)

    if (gen && !instColumns.has(col)) {
      for (const inst of instruments) {
        inst[col] = gen(inst)
      }
      dim.dimensionType = 'range'
      dim.segmentable = true
      console.log(`Converted to range + generated: ${dim.dimensionName} | ${col}`)
    }
  }
}

console.log('\nSyncing dimensions.json metadata...')
for (const dim of dimensions) {
  if (!dim.segmentable) continue
  const col = dim.dimensionColumn
  const instVals = instruments.map(i => i[col]).filter(v => v !== null && v !== undefined)
  if (instVals.length === 0) continue

  if (dim.dimensionType === 'list') {
    const unique = [...new Set(instVals.map(String))].sort()
    dim.values = unique
    dim.valueCount = unique.length
  } else if (dim.dimensionType === 'range') {
    const nums = instVals.filter(v => typeof v === 'number')
    if (nums.length > 0) {
      dim.minValue = Math.min(...nums)
      dim.maxValue = Math.max(...nums)
    }
  }
}

fs.writeFileSync(instrumentsPath, JSON.stringify(instruments, null, 2) + '\n')
fs.writeFileSync(dimensionsPath, JSON.stringify(dimensions, null, 2) + '\n')

const afterMissing = getSegmentableDimsWithoutData()
console.log(`\nDone. Remaining dims without data: ${afterMissing.length}`)
if (afterMissing.length > 0) {
  for (const d of afterMissing) {
    console.log(`  - ${d.dimensionName} | ${d.dimensionColumn} | type: ${d.dimensionType}`)
  }
}
