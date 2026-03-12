import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react'

interface Section {
  title: string
  problem: string
  decision: string
  detail: string
}

const sections: Section[] = [
  {
    title: '1. Empty start state',
    problem:
      'Pre-loaded example data can confuse testers into thinking they are looking at real segments. It also skips the creation flow entirely, hiding usability issues in the first interaction.',
    decision:
      'The prototype starts with an empty tree and a single "New Segment Group" button. Users must create their own groups and segments from scratch.',
    detail:
      'This forces every tester through the full creation flow: create group, name it, add segments, configure dimensions, build rules. It surfaces onboarding friction early. The button uses a prominent solid style initially and shifts to a dashed border once groups exist.',
  },
  {
    title: '2. Segment groups and hierarchy',
    problem:
      'Different analytical needs require different segmentation approaches for the same data. A single flat list of segments cannot represent this. Analysts also need parent-child structure to organize segments logically.',
    decision:
      'Users can create multiple segment groups, each with its own tree structure. Segments support parent-child nesting. Only leaf segments can have rules assigned.',
    detail:
      'This matches the existing ModelIQ 5-level hierarchy. Segment groups represent different perspectives on the same portfolio (e.g., by product type vs. by risk profile). Groups have editable mnemonics. Parent nodes serve as organizational containers only. Groups can be created and deleted freely.',
  },
  {
    title: '3. Per-group dimension configuration',
    problem:
      'Different product types need different dimensions. A deposit portfolio segments by rate sensitivity and maturity, while a loan portfolio segments by credit score, LTV, and collateral type. A single global dimension set forces irrelevant options on every group.',
    decision:
      'Each segment group has its own set of selected dimensions and bucket definitions. When a user configures dimensions for one group, it does not affect other groups.',
    detail:
      'Dimension state (selected dimensions and their bucket definitions) is stored per group in the data model. This enables a "Loan Portfolio" group using credit-focused dimensions alongside a "Deposit Portfolio" group using rate-focused dimensions, without conflict.',
  },
  {
    title: '4. Progressive disclosure for dimension selection',
    problem:
      'First-time users need guidance to understand that dimensions must be configured before rules can be built. Returning users already know this and just want quick access to change their selections.',
    decision:
      'When a user clicks a leaf segment in a group with no dimensions configured, the dimension selector opens as a full panel with guidance text. After initial configuration, the selector is accessible via a compact "Dimensions (N)" button in the header.',
    detail:
      'This two-state approach balances onboarding with efficiency. First-time: full-panel selector with intro message explaining the step. Subsequent: subtle header button showing the count of selected dimensions. The full panel never re-appears automatically once dimensions are configured.',
  },
  {
    title: '5. Dimension metadata and classification',
    problem:
      'With 77 dimensions available, not all are equally useful for segmentation. Instrument ID (1.8M values) is an identifier. Prepay Penalty Flag (yes/no) is a boolean. Product Code (8 values) is a meaningful characteristic. Users need orientation.',
    decision:
      'Dimensions are organized by category (Characteristic, Measure, Flag, Temporal, Identifier) with value counts and type indicators. Identifiers are grayed out as not segmentable. Categories start collapsed so users see the full taxonomy before drilling in.',
    detail:
      'Categories are inferred from data profiles: range type + non-date = Measure, flag-like name + low cardinality = Flag, extremely high cardinality = Identifier. Search auto-expands matching categories. This classification helps users focus on dimensions that drive segmentation decisions.',
  },
  {
    title: '6. Bucketing for range dimensions',
    problem:
      'Continuous numeric values (credit score, loan amount, coupon rate) cannot be selected individually. Credit scores range from 580 to 850. Users need to define meaningful ranges to segment by.',
    decision:
      'When a user selects a range/measure dimension, the system requires them to define named buckets (e.g., "Prime: 740-850", "Subprime: 580-660") before it can be used in rules. Bucket names then appear as selectable options in the Rule Builder.',
    detail:
      'At least 2 buckets must be defined. This prevents meaningless single-value groupings. The bucket definition step is inline within the dimension selector, not a separate workflow. The Rule Builder treats bucket names identically to categorical values, keeping the interaction consistent.',
  },
  {
    title: '7. Filtering dimensions before rule building',
    problem:
      'Loan data has 77 dimensions. Most are irrelevant for any given segmentation task. Showing all 77 in the Rule Builder dropdown would make condition creation tedious and error-prone.',
    decision:
      'Only dimensions selected in the configuration step appear in the Rule Builder condition dropdown. This keeps the interface focused on the 5-10 dimensions the user actually needs.',
    detail:
      'The dimension selector acts as a filter for the entire rule-building experience. The user chooses their working set up front, and the Rule Builder respects that choice. Changing the working set is always available via the header button.',
  },
  {
    title: '8. Conditions and exceptions',
    problem:
      'Users think about segmentation as "include these instruments, but not those." Expressing exclusions through complex negated conditions is unintuitive and error-prone.',
    decision:
      'Rules are structured as Conditions (include) + Exceptions (exclude). Conditions use AND logic between them. Exceptions exclude specific instruments from the matched set.',
    detail:
      'This aligns with how analysts naturally describe segments: "All fixed-rate commercial loans, except those with credit score below 660." The UI makes the relationship explicit with a visual separator and descriptive labels. Exceptions can only reference dimensions already used in conditions.',
  },
  {
    title: '9. Collapsible condition rows',
    problem:
      'With multiple conditions and exceptions, the rule definition can extend beyond the viewport. Users lose context of their overall rule while editing a single condition.',
    decision:
      'Conditions collapse to a single-line natural-language summary after values are selected. Click to expand for editing. A "Done" button collapses back to the summary.',
    detail:
      'The collapsed summary reads like a sentence (e.g., "Product Code is any of FRM-30, ARM-5/1 +3"). This keeps the full rule visible at a glance. The pattern scales to 5+ conditions without overwhelming the viewport.',
  },
  {
    title: '10. Portfolio coverage and balance preview',
    problem:
      'Users build rules without knowing how much of the portfolio they are covering. They cannot tell if a segment captures 5% or 50% of the total balance until they save and check downstream reports.',
    decision:
      'A persistent balance preview shows four metrics in real time: Total Portfolio, This Segment (matched by current rule), Assigned (all segments combined), and Unassigned (instruments not in any segment).',
    detail:
      'Values update as conditions change. Red text highlights zero matches. Percentages show relative coverage. This gives immediate feedback on whether the rule is too broad, too narrow, or conflicting with other segments.',
  },
  {
    title: '11. Matched instruments for troubleshooting',
    problem:
      'When a rule matches fewer instruments than expected, users have no way to inspect what actually matched. Debugging requires leaving the tool and querying the data manually.',
    decision:
      'A collapsible "Matched Instruments" section appears below the Rule Builder whenever a rule has conditions. It shows a table of instruments that match the current rule, with sortable columns for the dimensions used in the rule and the balance.',
    detail:
      'The table supports search and limits display to 100 rows for performance. If zero instruments match, a warning appears. This makes it possible to verify "did my rule capture the right loans?" without leaving the segmentation interface.',
  },
  {
    title: '12. Declarative rules instead of Cartesian products',
    problem:
      'The current system generates all possible dimension value combinations as a Cartesian product. With many dimensions and values, this creates millions of rows, causing browser freezes and enormous payloads.',
    decision:
      'Segment rules are stored as declarative constraints ("Product Code IN [CML, RTL] AND Risk Rating IN [Pass, Watch]") instead of enumerating every matching combination.',
    detail:
      'The backend evaluates these constraints at query time. The frontend never materializes the full combination matrix. This eliminates the performance ceiling entirely and scales to any number of dimensions and values. It is the architectural foundation that makes all the above decisions viable.',
  },
]

function RationaleSection({ section }: { section: Section }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-surface-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-surface-50 transition-colors"
      >
        <div className="mt-0.5 text-surface-400 shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-surface-800">{section.title}</h3>
          {!expanded && (
            <p className="text-sm text-surface-500 mt-1 line-clamp-1">{section.problem}</p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pl-11 space-y-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-red-500">Problem</span>
            <p className="text-sm text-surface-600 mt-1">{section.problem}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-green-600">Decision</span>
            <p className="text-sm text-surface-600 mt-1">{section.decision}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-surface-400">Detail</span>
            <p className="text-sm text-surface-500 mt-1">{section.detail}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function Rationale() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 overflow-y-auto bg-surface-50 p-8">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6"
        >
          <ArrowLeft size={14} />
          Back to home
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-surface-800 mb-2">Design Rationale</h1>
          <p className="text-surface-500">
            Each decision follows the order you would encounter it when using the prototype.
            Click a section to see the problem it solves, the decision made, and implementation detail.
          </p>
        </div>

        <div className="space-y-3">
          {sections.map(section => (
            <RationaleSection key={section.title} section={section} />
          ))}
        </div>
      </div>
    </div>
  )
}
