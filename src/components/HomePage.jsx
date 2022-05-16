import {
    Page,
    Layout,
} from "@shopify/polaris";

import {Products} from "./Products.jsx";

export function HomePage() {
    return (
        <Page>
            <Layout.Section>
                <Products/>
            </Layout.Section>
        </Page>
    );
}