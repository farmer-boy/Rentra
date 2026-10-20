"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalDuration = exports.LocationLevel = exports.HostelGenderPolicy = exports.DisputeStatus = exports.PaymentProviderType = exports.PaymentStatus = exports.PaymentMethod = exports.AgreementStatus = exports.ListingStatus = exports.PropertyType = exports.Role = void 0;
var Role;
(function (Role) {
    Role["TENANT"] = "TENANT";
    Role["LANDLORD"] = "LANDLORD";
    Role["ADMIN"] = "ADMIN";
})(Role || (exports.Role = Role = {}));
var PropertyType;
(function (PropertyType) {
    PropertyType["HOUSE"] = "HOUSE";
    PropertyType["APARTMENT"] = "APARTMENT";
    PropertyType["FLAT"] = "FLAT";
    PropertyType["PORTION"] = "PORTION";
    PropertyType["ROOM"] = "ROOM";
    PropertyType["HOSTEL"] = "HOSTEL";
    PropertyType["HOTEL"] = "HOTEL";
    PropertyType["GUEST_HOUSE"] = "GUEST_HOUSE";
    PropertyType["STUDIO"] = "STUDIO";
    PropertyType["FARMHOUSE"] = "FARMHOUSE";
    PropertyType["PG"] = "PG";
    PropertyType["SHARED_ROOM"] = "SHARED_ROOM";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
var ListingStatus;
(function (ListingStatus) {
    ListingStatus["PENDING"] = "PENDING";
    ListingStatus["VERIFIED"] = "VERIFIED";
    ListingStatus["FLAGGED"] = "FLAGGED";
    ListingStatus["REMOVED"] = "REMOVED";
})(ListingStatus || (exports.ListingStatus = ListingStatus = {}));
var AgreementStatus;
(function (AgreementStatus) {
    AgreementStatus["DRAFT"] = "DRAFT";
    AgreementStatus["PENDING"] = "PENDING";
    AgreementStatus["ACTIVE"] = "ACTIVE";
    AgreementStatus["ENDED"] = "ENDED";
    AgreementStatus["TERMINATED"] = "TERMINATED";
    AgreementStatus["EXPIRED"] = "EXPIRED";
    AgreementStatus["CANCELLED"] = "CANCELLED";
})(AgreementStatus || (exports.AgreementStatus = AgreementStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["JAZZCASH"] = "JAZZCASH";
    PaymentMethod["EASYPAISA"] = "EASYPAISA";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["AUTHORIZED"] = "AUTHORIZED";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["PARTIALLY_REFUNDED"] = "PARTIALLY_REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentProviderType;
(function (PaymentProviderType) {
    PaymentProviderType["JAZZCASH"] = "JAZZCASH";
    PaymentProviderType["EASYPAISA"] = "EASYPAISA";
    PaymentProviderType["CARD"] = "CARD";
    PaymentProviderType["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentProviderType["OTHER"] = "OTHER";
    PaymentProviderType["LEGACY"] = "LEGACY";
})(PaymentProviderType || (exports.PaymentProviderType = PaymentProviderType = {}));
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["OPEN"] = "OPEN";
    DisputeStatus["MEDIATION"] = "MEDIATION";
    DisputeStatus["RESOLVED"] = "RESOLVED";
    DisputeStatus["CLOSED"] = "CLOSED";
})(DisputeStatus || (exports.DisputeStatus = DisputeStatus = {}));
var HostelGenderPolicy;
(function (HostelGenderPolicy) {
    HostelGenderPolicy["MALE"] = "MALE";
    HostelGenderPolicy["FEMALE"] = "FEMALE";
    HostelGenderPolicy["MIXED"] = "MIXED";
})(HostelGenderPolicy || (exports.HostelGenderPolicy = HostelGenderPolicy = {}));
var LocationLevel;
(function (LocationLevel) {
    LocationLevel["COUNTRY"] = "COUNTRY";
    LocationLevel["PROVINCE"] = "PROVINCE";
    LocationLevel["CITY"] = "CITY";
    LocationLevel["AREA"] = "AREA";
    LocationLevel["BLOCK_SECTOR"] = "BLOCK_SECTOR";
})(LocationLevel || (exports.LocationLevel = LocationLevel = {}));
var RentalDuration;
(function (RentalDuration) {
    RentalDuration["DAILY"] = "DAILY";
    RentalDuration["NIGHTLY"] = "NIGHTLY";
    RentalDuration["WEEKLY"] = "WEEKLY";
    RentalDuration["MONTHLY"] = "MONTHLY";
    RentalDuration["LONG_TERM"] = "LONG_TERM";
})(RentalDuration || (exports.RentalDuration = RentalDuration = {}));
