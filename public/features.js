class Feature {
    constructor(title, description) {
        this.title = title;
        this.description = description;
    }
    createListItem() {
        const li = document.createElement('li');
        const h3 = document.createElement('h3');
        h3.textContent = this.title;
        const p = document.createElement('p');
        p.textContent = this.description;
        li.appendChild(h3);
        li.appendChild(p);
        return li;
    }
}
class FeatureRenderer {
    constructor(targetElementId) {// id of the target ul element
        this.targetElement = document.getElementById(targetElementId);
    }
    render(features) { // features is an array of Feature objects
        features.forEach(feature => {
            const featureElement = feature.createListItem();
            this.targetElement.appendChild(featureElement);
        });
    } 
}
document.addEventListener('DOMContentLoaded', () => {
    const collegeFeaturesData = [
        new Feature("Raise Funds Easily", "Streamlined process to connect with potential sponsors and secure funding."),
        new Feature("Proposal Templates", "Professional templates to create compelling sponsorship proposals."),
        new Feature("Reach Sponsors", "Direct access to businesses looking to sponsor college events."),
        new Feature("Event Management", "Tools to manage your event details and sponsorship tiers all in one place.")
    ];
    const vendorFeaturesData = [
        new Feature("Campus Visibility", "Gain exposure to the valuable student demographic."),
        new Feature("Affordable Branding", "Cost-effective opportunities to promote your brand on campus."),
        new Feature("Direct Student Reach", "Connect directly with your target audience through campus events."),
        new Feature("Targeted Filtering", "Find the perfect events that match your brand's marketing goals.")
    ];
    const collegeListRenderer = new FeatureRenderer('college-feature-list');
    collegeListRenderer.render(collegeFeaturesData);
    const vendorListRenderer = new FeatureRenderer('vendor-feature-list');
    vendorListRenderer.render(vendorFeaturesData);
});