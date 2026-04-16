"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeStatus = exports.PaymentStatus = exports.PaymentMethod = exports.AgreementStatus = exports.ListingStatus = exports.PropertyType = exports.Role = void 0;
var Role;
(function (Role) {
    Role["TENANT"] = "TENANT";
    Role["LANDLORD"] = "LANDLORD";
    Role["ADMIN"] = "ADMIN";
})(Role || (exports.Role = Role = {}));
var PropertyType;
(function (PropertyType) {
    PropertyType["FLAT"] = "FLAT";
    PropertyType["ROOM"] = "ROOM";
    PropertyType["HOUSE"] = "HOUSE";
    PropertyType["STUDIO"] = "STUDIO";
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
    AgreementStatus["PENDING"] = "PENDING";
    AgreementStatus["ACTIVE"] = "ACTIVE";
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
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["OPEN"] = "OPEN";
    DisputeStatus["MEDIATION"] = "MEDIATION";
    DisputeStatus["RESOLVED"] = "RESOLVED";
    DisputeStatus["CLOSED"] = "CLOSED";
})(DisputeStatus || (exports.DisputeStatus = DisputeStatus = {}));
