const NS = "org.sample.management.will.participant"
const WILLNS = "org.sample.management.will"

/**
 * Create will owner transaction
 * @param {org.sample.management.will.participant.CreateWillOwner} ownerDetails
 * @transaction
 */
async function createWillOwner(ownerDetails){
    let factory = getFactory();
    let willOwnerRegistry = await getParticipantRegistry(NS+'.WillOwner')
    let willOwner = factory.newResource(NS,'WillOwner',ownerDetails.adhaarCard)
    let name = factory.newConcept(NS,'Name');
    name.fName = ownerDetails.name.fName;
    name.lName = ownerDetails.name.lName;
    willOwner.name = name;
    willOwner.age = ownerDetails.age;
    willOwner.gender = ownerDetails.gender;
    await willOwnerRegistry.add(willOwner);
}

/**
 * Create will legal custodian
 * @param {org.sample.management.will.participant.CreateLegalCustodian} legalCustodianDetails
 * @transaction
 */
async function createLegalCustodian(legalCustodianDetails){
    let legalCustodiansByLicenseNumber = await query('GetLegalCustodianDetailsByLegalLicenseNumber',{
        legalLicenseNumber : legalCustodianDetails.legalLicenseNumber
    })
    if(legalCustodiansByLicenseNumber.length > 0)
        throw new Error("Legal custodian with licenseNumber already exists");
    let factory = getFactory();
    let legalCustodianRegistry = await getParticipantRegistry(NS+'.LegalCustodian')
    let legalCustodian = factory.newResource(NS,'LegalCustodian',legalCustodianDetails.adhaarCard)
    let name = factory.newConcept(NS,'Name');
    name.fName = legalCustodianDetails.name.fName;
    name.lName = legalCustodianDetails.name.lName;
    legalCustodian.name = name;
    legalCustodian.age = legalCustodianDetails.age;
    legalCustodian.gender = legalCustodianDetails.gender;
    legalCustodian.legalLicenseNumber = legalCustodianDetails.legalLicenseNumber;
    await legalCustodianRegistry.add(legalCustodian);
}


/**
 * Create judicial officer
 * @param {org.sample.management.will.participant.CreateJudicialOfficer} judicialOfficerDetails
 * @transaction
 */
async function createJudicialOfficer(judicialOfficerDetails){
    let judicialOfficersWithCentralGovernmentEmployeeId = await query('GetJudicialOfficerDetailsByCentralGovernmentEmployeeId',{
        centralGovernmentEmployeeId : judicialOfficerDetails.centralGovernmentEmployeeId
    })
    if(judicialOfficersWithCentralGovernmentEmployeeId.length > 0)
        throw new Error("Judicial officer with central government id already exists");
    let factory = getFactory();
    let judicialOfficerRegistry = await getParticipantRegistry(NS+'.JudicialOfficer')
    let judicialOfficer = factory.newResource(NS,'JudicialOfficer',judicialOfficerDetails.adhaarCard)
    let name = factory.newConcept(NS,'Name');
    name.fName = judicialOfficerDetails.name.fName;
    name.lName = judicialOfficerDetails.name.lName;
    judicialOfficer.name = name;
    judicialOfficer.age = judicialOfficerDetails.age;
    judicialOfficer.gender = judicialOfficerDetails.gender;
    judicialOfficer.centralGovernmentEmployeeId = judicialOfficerDetails.centralGovernmentEmployeeId;
    await judicialOfficerRegistry.add(judicialOfficer);
} 


/**
 * Create the will asset
 * @param {org.sample.management.will.CreateWill} willDetails
 * @transaction
 */
async function createWill(willDetails){
    let factory = getFactory();
    let willOwnerRegistry = await getParticipantRegistry(NS+'.WillOwner')
    try{
        let willOwner = await willOwnerRegistry.get(willDetails.willOwnerId)
    }catch(err){
        throw new Error(err)
    }
    let legalCustodianRegistry = await getParticipantRegistry(NS+'.LegalCustodian')
    try{
        let legalCustodian = await legalCustodianRegistry.get(willDetails.legalCustodianId)
    }catch(err){
        throw new Error(err)
    }
    let willRegistry = await getAssetRegistry(WILLNS+".Will")
    let will = factory.newResource(WILLNS,"Will",willDetails.willId)
    will.amount = willDetails.amount;
    will.content = willDetails.content;
    will.status = "APPROVAL_REQUEST_TO_LEGAL_CUSTODIAN";
    will.owner = factory.newRelationship(NS,'WillOwner',willDetails.willOwnerId);
    will.legalCustodian = factory.newRelationship(NS,'LegalCustodian',willDetails.legalCustodianId)
    will.creationDate = new Date();
    await willRegistry.add(will);
    let event = factory.newEvent(WILLNS,'WillCreated');
    event.willId = willDetails.willId;
    emit(event);
}

/**
 * Update will details
 * @param {org.sample.management.will.UpdateWill} willDetails
 * @transaction 
 */
async function updateWill(willDetails){
    let factory = await getFactory();
    let willRegistry = await getAssetRegistry(WILLNS+".Will")
    let will = null;
    try{
        will = await willRegistry.get(willDetails.willId);
    }catch(err){
        throw new Error("No will exists with this will id");
    }
    will.amount = willDetails.amount;
    will.content = willDetails.content;
    await willRegistry.update(will);
    let event = factory.newEvent(WILLNS,'WillUpdated');
    event.willId = willDetails.willId;
    emit(event);
}

/**
 * Mark will as deleted
 * @param {org.sample.management.will.DeleteWill} willDetails 
 * @transaction
 */
async function deleteWill(willDetails){
    let factory = await getFactory();
    let willRegistry = await getAssetRegistry(WILLNS+".Will")
    let will = null;
    try{
        will = await willRegistry.get(willDetails.willId);
    }catch(err){
        throw new Error("No will exists with this will id");
    }
    will.status = "DELETED";
    await willRegistry.update(will);
    let event = factory.newEvent(WILLNS,'WillDeleted');
    event.willId = willDetails.willId;
    emit(event);
}

/**
 * Reject Will As Legal Custodian
 * @param {org.sample.management.will.RejectWillAsLegalCustodian} details
 * @transaction 
 */
async function rejectWillAsLegalCustodian(details){
    let willRegistry = await getAssetRegistry(WILLNS+".Will")
    let will = null;
    try{
        will = await willRegistry.get(details.willId);
    }catch(err){
        throw new Error("No will exists with this will id");
    }
    will.status = "REJECTED_BY_LEGAL_CUSTODIAN";
    will.lastLegalCustodianRemark = details.lastLegalCustodianRemark;
    will.legalCustodianLastStatusUpdationDate = new Date();
    await willRegistry.update(will);
    let event = factory.newEvent(WILLNS,'LegalCustodianRejectedWill');
    event.willId = details.willId;
    emit(event);
}

/**
 * Reject Will As Judicial Officer
 * @param {org.sample.management.will.RejectWillAsJudicialOfficer} details
 * @transaction 
 */
async function rejectWillAsJudicialOfficer(details){
    let factory = await getFactory()
    let willRegistry = await getAssetRegistry(WILLNS+".Will")
    let will = null;
    try{
        will = await willRegistry.get(details.willId);
    }catch(err){
        throw new Error("No will exists with this will id");
    }
    will.status = "REJECTED_BY_JUDICIAL_OFFICER";
    will.lastJudicialOfficerRemark = details.lastJudicialOfficerRemark;
    will.judicialOfficerLastStatusUpdationDate = new Date();
    await willRegistry.update(will);
    let event = factory.newEvent(WILLNS,'JudicialOfficerRejectedWill');
    event.willId = details.willId;
    emit(event);
}

/**
 * Approve Will As Legal Custodian
 * @param {org.sample.management.will.ApproveWillAsLegalCustodian} details 
 * @transaction
 */
async function approveWillAsLegalCustodian(details){
    let willRegistry = await getAssetRegistry(WILLNS+".Will")
    let will = null;
    try{
        will = await willRegistry.get(details.willId);
    }catch(err){
        throw new Error("No will exists with this will id");
    }
    let judicialOfficerRegistry = await getParticipantRegistry(NS+'.JudicialOfficer')
    try{
        let judicialOfficer = await judicialOfficerRegistry.get(details.judicialOfficerId)
    }catch(err){
        throw new Error("No judicial officer exists with given id")
    }
    let factory = getFactory();
    will.judicialOfficer = factory.newRelationship(NS,'JudicialOfficer',details.judicialOfficerId)
    will.lastLegalCustodianRemark = details.lastLegalCustodianRemark;
    will.legalCustodianLastStatusUpdationDate = new Date();
    will.status = "APPROVAL_REQUEST_TO_JUDICIAL_OFFICER";
    await willRegistry.update(will);
    let event = factory.newEvent(WILLNS,'LegalCustodianApprovedWill');
    event.willId = details.willId;
    emit(event);
}


/**
 * Approve Will As Judicial Officer
 * @param {org.sample.management.will.ApproveWillAsJudicialOfficer} details 
 * @transaction
 */
async function approveWillAsJudicialOfficer(details){
    let factory = await getFactory()
    let willRegistry = await getAssetRegistry(WILLNS+".Will")
    let will = null;
    try{
        will = await willRegistry.get(details.willId);
    }catch(err){
        throw new Error("No will exists with this will id");
    }
    will.lastJudicialOfficerRemark = details.lastJudicialOfficerRemark;
    will.judicialOfficerLastStatusUpdationDate = new Date();
    will.status = "APPROVED";
    await willRegistry.update(will);
    let event = factory.newEvent(WILLNS,'JudicialOfficerApprovedWill');
    event.willId = details.willId;
    emit(event);
    event = factory.newEvent(WILLNS,'WillApproved');
    event.willId = details.willId;
    emit(event);
}

