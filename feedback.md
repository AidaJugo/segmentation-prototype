# Prototype Feedback

Collected during first review. Each item includes the observation and suggested fix direction.

## 1. Cannot create nested child segments

**Observation**: The tree starts with one level of leaf segments under "Loan Portfolio", but there is no way to create child segments underneath an existing leaf. Clicking "Add child segment" on a leaf should convert it into a parent and nest a new child below it.

**Expected**: Users should be able to build a multi-level hierarchy (e.g., Loan Portfolio > Fixed Rate Loans > High Balance Fixed). This mirrors the 5-level hierarchy in production ModelIQ.

## 2. No visual feedback when selecting a parent node

**Observation**: When a user clicks a parent node (a segment group or a segment that has children), there is no indication that mapping is only allowed on leaf segments. The right panel just stays empty or shows the last selected leaf, which is confusing.

**Expected**: Selecting a parent node should show a clear message in the right panel: something like "This is a group node. Select a leaf segment below to define mapping." Optionally, the parent row in the tree could have a distinct visual treatment (folder icon, non-selectable style) to reinforce that only leaves accept rules.

## 3. No way to navigate back or manage multiple segment groups

**Observation**: Once inside a segment group, there is no logical way to go "back" to a higher-level view. There is also no way to create multiple segment groups (e.g., segmenting the same loan data differently for different purposes, or segmenting different instrument types). The prototype only has the one pre-built "Loan Portfolio" group with no path to create additional ones.

**Expected**: Users should be able to create and switch between multiple segment groups. There should be a clear navigation pattern (back button, breadcrumb, or group list view) so users can move between groups.

## 4. "Aggregate Data" button is unclear

**Observation**: The "Aggregate Data" button in the header is copied from the production UI but is currently disabled and its purpose is ambiguous in this context. If aggregation means "finalize this segmentation for use in modeling", the label should communicate that. If it is not relevant to what we are testing, it creates noise.

**Expected**: Either rename to something clearer (e.g., "Save Segmentation") to signal that the tree + assignments are ready for downstream use, or remove it entirely for the prototype since we are focused on the mapping experience, not the save/publish flow. If kept, it should be visually marked as work-in-progress (e.g., grayed with a tooltip "Coming soon").

## 5. "Updated Segment" and "Production Use" legend is out of scope

**Observation**: The legend bar showing "Updated Segment" (warning icon) and "Production Use" (lock icon) appears below the Segments header. These are production governance concepts (model lifecycle status). They are not relevant to what we are testing in this prototype (the mapping workflow) and add visual clutter.

**Expected**: Remove the legend bar for the prototype. These indicators belong at the individual segment level in production, not as a static legend. Removing them keeps the tree area focused on the task at hand.

## 6. No validation for conflicting or duplicate conditions

**Observation**: There is no guard against adding contradictory or redundant rules. Specific cases:
- Same dimension used in both conditions and exceptions (e.g., Product Code IN [FRM-30] as a condition AND as an exception, silently matching zero instruments)
- Duplicate conditions on the same dimension (e.g., two separate Product Code rows), which is redundant and confusing
- In the two-layer approach, the same issue applies between category criteria and exception criteria

**Expected**: At minimum, warn the user when:
- A condition dimension is also used in an exception (highlight the conflict)
- The same dimension appears in multiple condition rows (suggest merging)
- The resulting match is empty due to contradicting rules (show "0 matches" prominently with an explanation)

This applies to all three approaches (rule builder, two-layer, and indirectly to bucketing if bucket definitions overlap).

## 7. Unclear how to save a condition and how to add multiple conditions/exceptions

**Observation**: After creating a condition and selecting values, there is no explicit "save" or "apply" action. The condition just exists. It is not obvious whether the condition is persisted, whether I need to confirm it, or how to add a second condition or a second exception. The "Add Condition" and "Add Exception" buttons exist but they are easy to miss, and the flow of "I finished this condition, now I want another one" is not guided.

**Expected**:
- Make it clearer that conditions auto-apply (live preview updates as you select values, no explicit save needed), OR add a confirm/apply step per condition
- After adding a condition, draw attention to the "Add Condition" button (e.g., brief highlight, or a prompt like "Add another condition to narrow the match")
- Same for exceptions: after adding one, make it easy to see that more can be added
- Consider a summary line per condition (e.g., "Product Code is any of FRM-30, FRM-15") so completed conditions collapse into a readable sentence

## 8. Relationship between conditions and exceptions is not explained

**Observation**: The UI does not explain how exceptions relate to conditions. The mental model is: conditions define the match set (AND logic), then exceptions carve out from that match set. An exception can use any dimension, not just those already in conditions. But without explanation, users may assume exceptions must reference the same dimensions as conditions, or may not understand the evaluation order at all.

**Expected**:
- Add a brief inline explanation or tooltip: "Exceptions exclude instruments from the matched set above"
- Visually connect the two sections (e.g., an arrow or flow indicator showing "Conditions match X instruments -> Exceptions remove Y -> Final: Z instruments")
- In the two-layer approach, this is somewhat clearer by design (Category at top, Exceptions below with "Exclude:" prefix), but the rule builder needs the same clarity

## 9. Balance preview updates are not noticeable

**Observation**: The portfolio coverage bar at the bottom does update live as conditions change, but there is no visual signal that a change just happened. The numbers change silently. Combined with the unclear save model (item 7), the user cannot tell whether their actions are taking effect. This creates doubt: "Did my condition do anything? Do I need to save first?"

**Expected**:
- Animate or briefly highlight the balance preview when values change (e.g., number transitions, a flash/pulse on the changed values)
- If matched count goes from 0 to N, make it obvious (green highlight, count-up animation)
- If matched count drops to 0 (possible conflict), make that prominent too (red/warning state)
- Consider adding a "last updated" micro-indicator or a brief toast/notification ("Matched 60 instruments") to confirm the action had an effect

## 10. Numeric exception defaults to full range, silently excluding everything

**Observation** (from screenshot): Adding an exception on a bucket dimension (e.g., Current Book Value) defaults to the full min/max range (-100,000 to 6,000,000). This immediately excludes every matched instrument, resulting in 0 matches. There is no warning, no explanation, and the balance preview silently shows $0 / 0 instruments. The user has no idea why their segment is empty.

**Expected**:
- Numeric exceptions should default to empty/blank inputs, not the full range
- If an exception results in 0 remaining matches, show a clear warning: "Exception excludes all matched instruments"
- Better yet, show a breakdown: "Condition matched 45 instruments -> Exception excluded 45 -> 0 remaining"

## 11. Inconsistent number formatting (locale issue)

**Observation** (from screenshot): The condition value input shows "0,0025" (comma as decimal separator, likely from browser locale), but the range hint below it reads "Range: 0.003 to 0.015" (period as decimal separator). This is inconsistent and could cause confusion or input parsing errors.

**Expected**: Use consistent number formatting throughout. Either respect the browser locale everywhere (including range hints) or normalize to a single format. Consider using formatted number inputs that handle locale differences gracefully.

## 12. Segment creation naming flow is unclear

**Observation** (from screenshot): The tree contains a segment named "no name", suggesting the user created a new segment but the naming prompt was missed or unclear. The inline rename field may be too subtle or may have lost focus.

**Expected**:
- When creating a new segment, force focus on the name input and don't allow deselection until a name is entered
- Provide a meaningful default name (e.g., "New Segment 1") rather than allowing blank/unnamed segments
- If the name is left blank, auto-assign a default rather than showing "no name"
