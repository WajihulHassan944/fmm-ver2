# Client Review Frontend Update

This update is additive and keeps the existing frontend structure/assets intact.

## Updated

- Admin fight edit screen now exposes fight video URL, promotional video URL, status fields, and scoring JSON fields.
- Shadow fight edit screen now loads the selected shadow template and exposes video/scoring controls clearly.
- Admin scoring no longer auto-calculates TP / Total Punches from HP + BP. Total punches remain a separate manual field.
- Scoring number inputs now use empty fields with `0` as placeholder, so admins can type without fighting a pre-filled zero.
- Admin login now includes show/hide password control.
- Public fight ordering now prioritizes featured, live, tonight, recently added, recently updated, and recently completed fights.
- Upcoming fights now diversify the first results by combat sport where possible, so users see a fresher mix of MMA, Boxing, Kickboxing, Bare-knuckle, etc.
- Homepage primary CTA now points to active fights instead of a demo/test fight.
- Homepage featured fight label now reflects the freshest active/recent fight.

## Notes

- No existing routes or components were removed.
- Font assets remain included.
- Backend Phase 2 client-review fixes are expected to be deployed before testing the new edit/scoring frontend behavior.
