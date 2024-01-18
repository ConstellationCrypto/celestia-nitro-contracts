// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "../../src/rollup/AbsRollupEventInbox.sol";
import {IBridge} from "../../src/bridge/IBridge.sol";

abstract contract AbsRollupEventInboxTest is Test {
    IRollupEventInbox public rollupEventInbox;
    IBridge public bridge;

    address public rollup = makeAddr("rollup");

    /* solhint-disable func-name-mixedcase */
    function test_initialize() public {
        assertEq(address(rollupEventInbox.bridge()), address(bridge), "Invalid bridge ref");
        assertEq(address(rollupEventInbox.rollup()), rollup, "Invalid rollup ref");
    }
        function test_initialize_revert_AlreadyInit() public {
        vm.expectRevert(AlreadyInit.selector);
        rollupEventInbox.initialize(bridge);
    }
}
