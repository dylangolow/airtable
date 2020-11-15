import {Box} from "@airtable/blocks/ui";
import React from "react";

export const DashboardTile = ({children, ...props}) => {
    return (
        <Box
            // position="relative"
            // flex="auto"
            padding={3}
            margin={2}
            borderRadius="large"
            backgroundColor="lightGray1"
            // minWidth="33%"
            // maxWidth="50%"
            {...props}>{children}</Box>
    );
}
