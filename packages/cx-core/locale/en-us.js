import { Localization } from 'cx/ui';

var c = 'en-us';

// Field
Localization.localize(c, 'cx/widgets/Field', {
   requiredText: 'This field is required.',
   validatingText: 'Validation is in progress...',
   validationExceptionText: 'Something went wrong during input validation. Check log for more details.'
});

// LookupField
Localization.localize(c, 'cx/widgets/LookupField', {
   loadingText: 'Loading...',
   queryErrorText: 'Error occurred while querying for lookup data.',
   noResultsText: 'No results found matching the given criteria.',
   minQueryLengthMessageText: 'Please type in at least {0} character(s) to start the search.'
});

// MonthField, DateField, Calendar
let dateFieldErrorMessages = {
   maxValueErrorText: 'Selected date is after the latest allowed date of {0:d}.',
   maxExclusiveErrorText: 'Selected date should be before {0:d}.',
   minValueErrorText: 'Selected date is before the earliest allowed date of {0:d}.',
   minExclusiveErrorText: 'Selected date should be after {0:d}.',
};
// MonthField
Localization.localize(c, 'cx/widgets/MonthField', { 
   ...dateFieldErrorMessages, 
   inputErrorText: 'Invalid date entered.'
});
Localization.localize(c, 'cx/widgets/DateField', dateFieldErrorMessages);
Localization.localize(c, 'cx/widgets/Calendar', dateFieldErrorMessages);

// NumberField
Localization.localize(c, 'cx/widgets/NumberField', {
   maxValueErrorText: 'The number should be at most {0:n}.',
   maxExclusiveErrorText: 'The number should be less than {0:n}.',
   minValueErrorText: 'The number should be at least {0:n}.',
   inputErrorText: 'Invalid number entered.'
});

// TextField
Localization.localize(c, 'cx/widgets/TextField', {
   validationErrorText: 'The entered value is not valid.',
   minLengthValidationErrorText: 'Please enter {[{0}-{1}]} more character(s).',
   maxLengthValidationErrorText: 'The entered text is longer than the maximum allowed {0} characters.'
});

// UploadButton
Localization.localize(c, 'cx/widgets/UploadButton', {
   validationErrorText: 'Upload is in progress.'
});