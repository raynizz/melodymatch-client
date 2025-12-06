export const Gender = Object.freeze({
  NotSpecified: 0,
  Male: 1,
  Female: 2,
});

export const GENDER_OPTIONS = [
  { value: Gender.NotSpecified, labelKey: "profile.melody.gender.notSpecified" },
  { value: Gender.Male, labelKey: "profile.melody.gender.male" },
  { value: Gender.Female, labelKey: "profile.melody.gender.female" },
];
