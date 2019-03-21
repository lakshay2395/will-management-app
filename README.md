# will-management-app
A decentralized will management application using hyperledger composer.

# main participants
* WillOwner
* LegalCustodian
* Judicial Officer

# Flow of application
* WillOwner createsa a will.
* Sends it for approval to a designated legal custodian.
* LegalCustodian may reject/accept the will.
* If accepted, LegalCustodian sends it to a designated JudicialOfficer for final approval.
* Similarily, JudicialOfficer may reject/accept the will.
* If accepted, will is marked as approved in database.


