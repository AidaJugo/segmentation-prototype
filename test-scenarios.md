# Test Scenarios - Segmentation Prototype

## Segment Tree (Left Panel)

### Tree Display (Empty Start)

- Given the page loads, When I see the left panel, Then I see a solid "New Segment Group" button with hint text "Start by creating a segment group"
- Given I create a segment group and add segments, When I look at the tree, Then the group shows with its segments listed below
- Given the tree is visible, When I click a collapsed segment group, Then it expands to show child segments
- Given the tree is visible, When I click an expanded segment group, Then it collapses
- Given the tree has parent segments, When I look at parent nodes, Then they show a folder icon to distinguish from leaf segments

### Multiple Segment Groups (Feedback Round 4)

- Given the tree panel is visible, When I look at the bottom, Then I see a "New Segment Group" button (dashed border)
- Given I click "New Segment Group", When the input appears, Then I can type a group name and press Enter to create an empty group
- Given I create a new empty group, When it appears in the tree, Then it shows "No segments yet. Add one to start defining rules."
- Given a new empty group exists, When I click "Add Segment" inside it, Then a new segment is created in edit mode ready for naming
- Given I press Escape or leave the group name empty, When the input blurs, Then the group creation is cancelled
- Given any segment group exists, When I hover over its header, Then a delete (trash) icon appears
- Given I click delete on a group with segments, When the confirmation dialog appears, Then I can confirm to delete the group and all its segments
- Given I delete the last segment group, When it's removed, Then the tree shows the solid "New Segment Group" button with hint text

### Segment Group Mnemonic

- Given a segment group exists, When I look at the group header, Then I see a mnemonic badge next to the group name
- Given the group mnemonic badge is visible, When I click on it, Then it becomes an editable input field pre-filled with the current mnemonic
- Given I am editing the group mnemonic, When I type a new value and press Enter, Then the mnemonic updates (uppercase, max 12 chars)
- Given I am editing the group mnemonic, When I press Escape, Then the edit is cancelled and the original mnemonic is restored
- Given a group has dimensions configured, When I look at the group header, Then I see a "N dims" badge showing how many dimensions are selected

### Tree Manipulation

- Given a segment group is expanded, When I click "Add Segment", Then a new segment appears in edit mode with an empty name input focused
- Given a segment exists, When I click the segment name, Then the right panel updates to show the mapping interface for that segment
- Given a segment is selected, When I click the menu icon, Then I see options: Rename, Add Child, Delete
- Given I confirm delete on a segment, When the segment had a mapping, Then the balance preview updates to reflect the removed mapping

### Nested Children (Feedback Item 1)

- Given a leaf segment exists, When I hover and click the "+" button, Then a new child segment is created in edit mode (name input focused, empty)
- Given a leaf segment with a rule exists, When I add a child beneath it, Then it becomes a parent node and mapping is only possible on the new child
- Given a parent segment has children, When I hover over the parent, Then I still see the "+" button to add more children at that level

### Parent Node Feedback (Feedback Item 2)

- Given a parent segment (non-leaf) exists, When I click on it, Then the right panel shows "This is a group node. Select a leaf segment below to define mapping." with a folder icon
- Given a parent is selected, When I look at the right panel, Then no condition/exception controls are shown

### New Segment Edit Mode (Feedback Round 4)

- Given I click "+" on a segment or "Add Segment" in a group, When the new segment appears, Then its name input is focused and empty (no pre-defined name)
- Given a new segment input is focused, When I type a name and press Enter, Then the segment is created with that name
- Given a new segment input is focused and empty, When I press Escape, Then the segment is deleted (cancelled)
- Given a new segment input is focused and empty, When I click elsewhere (blur), Then the segment is deleted (cancelled)

### Legend Removed (Feedback Item 5)

- Given the tree panel is visible, When I look below the Segments header, Then there is no "Updated Segment" / "Production Use" legend bar

### Aggregate Button Removed (Feedback Item 4)

- Given any approach page is loaded, When I look at the page header, Then there is no "Aggregate Data" button

## Balance Preview (Sticky Bottom Bar)

### Display

- Given I am on any approach route, When I look at the bottom of the right panel, Then I see: total portfolio balance, assigned balance/count/%, unassigned balance/count
- Given no segments have mappings, When I view the balance preview, Then total = full portfolio, assigned = 0, unassigned = 100%
- Given a leaf segment is selected, When I view the balance preview, Then I also see "This Segment" with matched balance/count/%

### Live Updates

- Given I add a condition to a segment, When the condition matches instruments, Then the balance preview updates immediately showing matched count and balance
- Given I remove a condition, When the match set changes, Then the balance preview updates immediately

### Balance Animation (Feedback Item 9)

- Given a condition is active and matching instruments, When I change the condition values, Then the updated numbers briefly flash/highlight to signal the change
- Given conditions exist but result in 0 matches, When I view the balance preview, Then "This Segment" shows in red with "0 instruments" and a warning "No instruments matched"

### Zero Match Warning (Feedback Item 9, 10)

- Given conditions are defined and exceptions exclude everything, When the match count drops to 0, Then a red warning banner appears: "No instruments matched. Check your conditions and exceptions for conflicts."

## Dimension Selection (Configure Dimensions)

### First-Leaf-Click Trigger (Per-Group)

- Given I created a new segment group with a leaf segment, When I click that leaf segment for the first time (no dimensions configured for this group), Then the dimension selector appears as a full panel in the right area with an intro message
- Given the intro dimension selector is showing, When I select dimensions and click "Done", Then the Rule Builder appears and a "Dimensions (N)" button shows in the header
- Given I click a leaf in a different group that also has no dimensions, When the dimension selector appears, Then it is independent from the first group's selection

### Accessing After Configuration

- Given a segment group has dimensions configured, When I look at the page header, Then I see a "Dimensions (N)" button showing how many dimensions are selected for the active group
- Given I click the "Dimensions" button, When the panel opens, Then I see all 80 loan dimensions grouped by category (Characteristics, Measures, Flags, Temporal, Identifiers)

### Categories and Metadata

- Given the dimension selector is open, When I look at a dimension row, Then I see: checkbox, name, type badge (list/range), value count
- Given I look at the Identifiers category, When I see "Instrument ID", Then it shows "1.8M values" and "not segmentable" with a disabled checkbox
- Given I look at a Measure dimension (e.g. Current Book Value), When it is selected, Then it shows "needs buckets" or "N buckets" badge

### Selection

- Given I check a characteristic dimension (e.g. Loan Type), When I close the panel, Then that dimension appears in the Rule Builder's condition dropdown
- Given I uncheck a dimension, When I close the panel, Then that dimension is no longer available in the Rule Builder
- Given I check 5 dimensions in quick succession, When I verify the checkboxes, Then all 5 remain checked (no selections lost)
- Given I selected dimensions and closed the panel, When I look at the "Dimensions (N)" button, Then N matches the number of dimensions I checked

### Search

- Given the dimension selector is open, When I type "risk" in the search field, Then only dimensions containing "risk" are shown (e.g. Risk Rating, Risk Rating Code, Original Risk Rating Code Key)

### Bucket Definition for Range Dimensions

- Given I select a range dimension (e.g. Current Book Value), When it is checked, Then an inline bucket editor appears below the dimension row
- Given the bucket editor is visible, When I click "Add bucket", Then a new row appears with name, min, and max inputs
- Given I define 2+ buckets with names and ranges, When I look at the badge, Then it shows "N buckets" in green
- Given I define only 1 bucket, When I look at the badge, Then it shows a warning "Define at least 2 buckets"

### Buckets in Rule Builder

- Given I defined buckets for Current Book Value ("Small: 0-100K", "Large: 100K-500K"), When I add a condition for Current Book Value in the Rule Builder, Then I see bucket names as checkboxes (not raw numeric inputs)
- Given I select bucket "Small" in a condition, When instruments are filtered, Then instruments with book value 0-100K match

### Done

- Given I am in the dimension selector, When I click "Done", Then the panel closes and the Rule Builder uses the updated selection

## Rule Builder (/prototype)

### Adding Conditions

- Given I selected a leaf segment and no conditions exist, When I see the panel, Then the "Add Condition" button appears inline below the empty state message
- Given I have conditions defined, When I look below the last condition, Then I see a dashed-border "Add Condition" button (not in the header)
- Given I selected a leaf segment, When I click "Add Condition", Then I see a dropdown of only the selected dimensions (not all 80)
- Given I picked a list dimension (e.g. Product Code), When the operator defaults to "IN", Then I see a compact dropdown for value selection (click to open, checkboxes inside)
- Given I picked a range dimension without buckets, When the operator defaults to "BETWEEN", Then I see empty min/max numeric inputs (not pre-filled with full range)
- Given I added a condition for Loan Type IN [CML], When I view the balance preview, Then it shows only instruments matching that loan type

### Numeric Defaults

- Given I add a condition on a range dimension without buckets, When the inputs appear, Then min and max fields are empty with placeholder text, not pre-filled with the dimension's full range
- Given I add an exception on a range dimension without buckets, When the inputs appear, Then they are also empty, not defaulting to the full range

### Multiple Conditions

- Given I have one condition (Product Code IN [FRM-30]), When I add another condition (Amortization Code IN [Fixed]), Then the match is AND logic -- only instruments matching BOTH conditions
- Given I have two conditions, When I remove the second condition, Then the match reverts to only the first condition

### Condition Summary (Feedback Item 7)

- Given I selected values for a condition, When I look at the condition row, Then I see a summary line (e.g. "Product Code is any of FRM-30, FRM-15") above the input controls
- Given I have conditions defined, When I look below the condition list, Then I see a hint "Add another condition to narrow the match further"
- Given conditions are defined, When I look at the conditions section header, Then I see helper text "Changes apply immediately"

### Collapsible Conditions (Feedback Round 2, 3)

- Given a condition has values selected, When I view it, Then it shows as a collapsed single-line summary by default
- Given a condition is collapsed, When I click on it, Then it expands to show the full value picker for editing
- Given a condition is expanded and has values, When I click "Done", Then it collapses back to the summary line
- Given I add a new condition, When it appears, Then it starts expanded (ready for editing)
- Given a collapsed condition exists, When I hover over it, Then edit and remove buttons appear

### Editable Mnemonic (Feedback Round 3)

- Given a leaf segment is selected, When I look at the segment header, Then I see the mnemonic badge next to the segment name
- Given the mnemonic badge is visible, When I click on it, Then it becomes an editable input field pre-filled with the current mnemonic
- Given I am editing the mnemonic, When I type a new value and press Enter, Then the mnemonic updates (uppercase, max 12 chars)
- Given I am editing the mnemonic, When I click outside, Then the mnemonic saves and the input reverts to the badge
- Given I am editing the mnemonic, When I press Escape, Then the edit is cancelled and the original mnemonic is restored

### Save Rules Action (Feedback Round 2)

- Given a segment has conditions with values, When I look at the segment header, Then I see a "Save Rules" button
- Given I click "Save Rules", When the save completes, Then the button briefly shows "Saved" with a checkmark
- Given no conditions have values yet, When I look at the segment header, Then the "Save Rules" button is hidden

### Conflict Warnings (Feedback Item 6)

- Given a dimension is used in two condition rows, When I look at the rule builder, Then a warning appears: "Multiple conditions use the same dimension. Consider merging them."
- Given a dimension appears in both a condition and an exception with overlapping values, When I look at the rule builder, Then a warning appears about the conflict

### Exceptions

- Given I have conditions defined, When I click "Add Exception", Then I see a visually distinct section below conditions
- Given I add an exception (Current Book Value < 50000), When I view results, Then instruments matching the main conditions BUT matching the exception are excluded

### Exception Relationship (Feedback Item 8, Round 3)

- Given the exception section is visible, When I look at it, Then I see a subtitle "Exclude specific instruments from the matched set above" (no info box, just subtitle text matching conditions style)
- Given exceptions exist, When I look below the last exception, Then I see an "Add Exception" button (dashed border, same pattern as "Add Condition")

### Error Recovery

- Given I made a mistake in a condition, When I click the edit icon on that condition, Then I can modify the values inline
- Given I want to undo, When I click the undo button, Then the last action is reversed and the balance preview updates

## Matched Instruments (Troubleshooting View)

### Display

- Given a segment has conditions defined, When I look below the rule builder, Then I see a collapsible "Matched Instruments (N)" header showing the count
- Given the matched instruments section is collapsed, When I click on it, Then it expands to show a searchable, sortable table
- Given matched count is 0, When I look at the header, Then the count shows in red and expanding reveals "No instruments matched this rule"
- Given a segment has no conditions, When I look below the rule builder, Then the matched instruments section is not visible

### Table Content

- Given matched instruments are displayed, When I look at the table columns, Then I see: ID, the dimensions used in the rule's conditions/exceptions, and Balance
- Given the table is visible, When I click a column header, Then the table sorts by that column (toggling ascending/descending)
- Given the table is visible, When I type in the search field, Then the table filters to instruments matching the search across dimension values

### Pagination

- Given more than 100 instruments match, When the table renders, Then it shows the first 100 with a message "Showing 100 of N instruments. Use search to narrow results."

## Number Formatting (Feedback Item 11)

- Given a bucket dimension has a range hint, When I look at it, Then it uses consistent formatting (en-US locale with commas for thousands)
- Given I type a numeric value, When I look at the range hint below, Then the format matches the input format (no mix of comma/period decimals)

## Cross-Flow

### Multi-Segment Coverage

- Given I defined mappings for 3 segments across the portfolio, When I view the balance preview, Then assigned percentage reflects all 3 segments combined and unassigned shows the remainder
- Given all instruments are assigned, When I view unassigned, Then unassigned count = 0 and percentage = 0%

### Segment Overlap Warning

- Given Segment A matches instrument #42, When Segment B also matches instrument #42, Then a visual indicator warns about the overlap

### Navigation

- Given I am on the landing page (/), When I click "User Testing Prototype", Then I navigate to /prototype with an empty tree (no pre-built groups)
- Given I am on the landing page (/), When I click "Design Rationale", Then I navigate to /rationale

## Design Rationale (/rationale)

- Given I navigate to /rationale, When the page loads, Then I see a list of design decision sections with titles
- Given I see a section title, When I click on it, Then it expands to show Problem, Decision, and Detail subsections
- Given an expanded section exists, When I click on it again, Then it collapses back to the title
- Given I am on the rationale page, When I click "Back to home", Then I navigate to the landing page

## Landing Page

- Given I navigate to /, When the page loads, Then I see two cards: "User Testing Prototype" and "Design Rationale"
- Given I click "User Testing Prototype", When the page navigates, Then I see the segmentation workspace at /prototype
- Given I click "Design Rationale", When the page navigates, Then I see the rationale page at /rationale

## Timing (Invisible)

- Given I start defining a segment mapping, When the timing logger captures it, Then it records start timestamp, action count increments per interaction, and end timestamp on save
- Given I completed testing, When I export timing data, Then I get a JSON file from localStorage with all timing entries
